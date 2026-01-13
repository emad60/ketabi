"""
خدمة إدارة المخزون - Inventory Service
تتعامل مع خصم الكميات من المخازن عند إنشاء الشحنات
"""
import logging
from typing import List, Dict, Any, Union
from django.db import transaction
from django.utils import timezone

from .models import WarehouseStock, StockMovement, MinistryToProvinceShipment, ProvinceToSchoolShipment

logger = logging.getLogger(__name__)


class InventoryService:
    """خدمة إدارة المخزون وخصم الكميات عند إنشاء الشحنات"""
    
    @staticmethod
    def deduct_inventory_for_shipment(shipment: Union[MinistryToProvinceShipment, ProvinceToSchoolShipment]) -> Dict[str, Any]:
        """
        خصم الكميات من المخزون بناءً على بيانات الشحنة
        
        Args:
            shipment: كائن الشحنة المراد خصم كمياتها (MinistryToProvinceShipment أو ProvinceToSchoolShipment)
            
        Returns:
            dict: نتيجة العملية مع التفاصيل
            {
                'success': bool,
                'message': str,
                'deducted_items': list,
                'errors': list
            }
        """
        if not shipment or not shipment.books:
            return {
                'success': False,
                'message': 'لا توجد كتب في الشحنة',
                'deducted_items': [],
                'errors': ['books field is empty']
            }
        
        # تحديد المستودع المصدر بناءً على نوع الشحنة
        source_warehouse = None
        warehouse_type = None
        
        if isinstance(shipment, MinistryToProvinceShipment):
            # شحنة من الوزارة إلى المحافظة - المصدر هو مستودع الوزارة
            source_warehouse = shipment.from_ministry
            warehouse_type = 'ministry'
        elif isinstance(shipment, ProvinceToSchoolShipment):
            # شحنة من المحافظة إلى المدرسة - المصدر هو مستودع المحافظة
            source_warehouse = shipment.from_province
            warehouse_type = 'province'
        else:
            return {
                'success': False,
                'message': f'نوع الشحنة غير معروف: {type(shipment)}',
                'deducted_items': [],
                'errors': ['unknown shipment type']
            }
        
        if not source_warehouse:
            return {
                'success': False,
                'message': 'المستودع المصدر غير محدد',
                'deducted_items': [],
                'errors': ['source warehouse not found']
            }
        
        deducted_items = []
        errors = []
        
        try:
            with transaction.atomic():
                # معالجة كل كتاب في قائمة الشحنة
                for book_item in shipment.books:
                    book_id = int(book_item.get('book_id'))
                    quantity = int(book_item.get('quantity'))
                    term = book_item.get('term')
                    
                    # البحث عن المخزون المناسب
                    try:
                        if warehouse_type == 'ministry':
                            stock = WarehouseStock.objects.select_for_update().get(
                                ministry_warehouse=source_warehouse,
                                book_id=book_id,
                                term=term
                            )
                        else:
                            stock = WarehouseStock.objects.select_for_update().get(
                                province_warehouse=source_warehouse,
                                book_id=book_id,
                                term=term
                            )
                        
                        # التحقق من توفر الكمية
                        if stock.quantity < quantity:
                            error_msg = f'الكمية غير كافية للكتاب {stock.book}: متوفر {stock.quantity} مطلوب {quantity}'
                            logger.warning(f'[INVENTORY] {error_msg} - Shipment #{shipment.id}')
                            errors.append(error_msg)
                            continue
                        
                        # خصم الكمية
                        previous_quantity = stock.quantity
                        stock.quantity -= quantity
                        stock.save()
                        
                        # تسجيل حركة المخزون
                        StockMovement.objects.create(
                            stock=stock,
                            movement_type='out',
                            quantity=-quantity,
                            previous_quantity=previous_quantity,
                            new_quantity=stock.quantity,
                            shipment=shipment,
                            reason=f'خصم للشحنة #{shipment.id} - {shipment.tracking_code}',
                            created_by=None  # النظام قام بالعملية
                        )
                        
                        deducted_items.append({
                            'book_id': book_id,
                            'book_name': str(stock.book),
                            'term': term,
                            'quantity_deducted': quantity,
                            'previous_stock': previous_quantity,
                            'new_stock': stock.quantity
                        })
                        
                        logger.info(
                            f'[INVENTORY] خصم {quantity} من {stock.book} ({term}) - '
                            f'الكمية السابقة: {previous_quantity} -> الجديدة: {stock.quantity}'
                        )
                    
                    except WarehouseStock.DoesNotExist:
                        error_msg = f'الكتاب {book_id} ({term}) غير موجود في المخزون'
                        logger.error(f'[INVENTORY] {error_msg} - Shipment #{shipment.id}')
                        errors.append(error_msg)
                        continue
                    
                    except Exception as e:
                        error_msg = f'خطأ في معالجة الكتاب {book_id}: {str(e)}'
                        logger.exception(f'[INVENTORY] {error_msg}')
                        errors.append(error_msg)
                        continue
                
                # إذا كانت هناك أخطاء، لا نقوم بالحفظ (rollback)
                if errors:
                    raise Exception(f'فشل خصم المخزون: {", ".join(errors)}')
        
        except Exception as e:
            logger.exception(f'[INVENTORY] فشلت عملية خصم المخزون للشحنة #{shipment.id}')
            return {
                'success': False,
                'message': str(e),
                'deducted_items': [],
                'errors': errors if errors else [str(e)]
            }
        
        # إذا تمت العملية بنجاح
        return {
            'success': True,
            'message': f'تم خصم {len(deducted_items)} عنصر من المخزون بنجاح',
            'deducted_items': deducted_items,
            'errors': []
        }
    
    @staticmethod
    def check_availability_for_shipment(shipment_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        التحقق من توفر الكميات قبل إنشاء الشحنة
        
        Args:
            shipment_data: بيانات الشحنة المقترحة
            
        Returns:
            dict: نتيجة الفحص
            {
                'available': bool,
                'items_status': list,
                'insufficient_items': list
            }
        """
        books = shipment_data.get('books', [])
        courier_role = shipment_data.get('courier_role')
        from_ministry = shipment_data.get('from_ministry')
        to_province = shipment_data.get('to_province')
        
        if not books:
            return {
                'available': False,
                'items_status': [],
                'insufficient_items': ['لا توجد كتب في الشحنة']
            }
        
        # تحديد المستودع المصدر
        source_warehouse = None
        warehouse_type = None
        
        if courier_role == 'ministry_courier':
            source_warehouse = from_ministry
            warehouse_type = 'ministry'
        elif courier_role == 'province_courier':
            source_warehouse = to_province
            warehouse_type = 'province'
        
        if not source_warehouse:
            return {
                'available': False,
                'items_status': [],
                'insufficient_items': ['المستودع المصدر غير محدد']
            }
        
        items_status = []
        insufficient_items = []
        
        for book_item in books:
            book_id = int(book_item.get('book_id'))
            quantity = int(book_item.get('quantity'))
            term = book_item.get('term')
            
            try:
                if warehouse_type == 'ministry':
                    stock = WarehouseStock.objects.get(
                        ministry_warehouse=source_warehouse,
                        book_id=book_id,
                        term=term
                    )
                else:
                    stock = WarehouseStock.objects.get(
                        province_warehouse=source_warehouse,
                        book_id=book_id,
                        term=term
                    )
                
                available = stock.quantity >= quantity
                items_status.append({
                    'book_id': book_id,
                    'book_name': str(stock.book),
                    'term': term,
                    'requested_quantity': quantity,
                    'available_quantity': stock.quantity,
                    'sufficient': available
                })
                
                if not available:
                    insufficient_items.append(
                        f'{stock.book} ({term}): متوفر {stock.quantity} / مطلوب {quantity}'
                    )
            
            except WarehouseStock.DoesNotExist:
                items_status.append({
                    'book_id': book_id,
                    'term': term,
                    'requested_quantity': quantity,
                    'available_quantity': 0,
                    'sufficient': False
                })
                insufficient_items.append(f'الكتاب {book_id} ({term}) غير موجود في المخزون')
        
        return {
            'available': len(insufficient_items) == 0,
            'items_status': items_status,
            'insufficient_items': insufficient_items
        }
    
    @staticmethod
    def add_inventory_from_ministry_shipment(shipment) -> Dict[str, Any]:
        """
        إضافة الكميات إلى مخزون المحافظة عند استلام شحنة من الوزارة
        
        Args:
            shipment: MinistryToProvinceShipment كائن الشحنة
            
        Returns:
            dict: نتيجة العملية
        """
        if not shipment or not shipment.books:
            return {
                'success': False,
                'message': 'لا توجد كتب في الشحنة',
                'added_items': [],
                'errors': ['books field is empty']
            }
        
        if not shipment.to_province:
            return {
                'success': False,
                'message': 'مستودع المحافظة المستلم غير محدد',
                'added_items': [],
                'errors': ['destination province warehouse not found']
            }
        
        added_items = []
        errors = []
        
        try:
            with transaction.atomic():
                for book_item in shipment.books:
                    book_id = int(book_item.get('book_id'))
                    quantity = int(book_item.get('quantity'))
                    term = book_item.get('term')
                    
                    try:
                        # البحث عن المخزون أو إنشاؤه
                        stock, created = WarehouseStock.objects.select_for_update().get_or_create(
                            province_warehouse=shipment.to_province,
                            book_id=book_id,
                            term=term,
                            defaults={'quantity': 0}
                        )
                        
                        # إضافة الكمية
                        stock.quantity += quantity
                        stock.save()
                        
                        # تسجيل الحركة
                        StockMovement.objects.create(
                            warehouse_stock=stock,
                            movement_type='in',
                            quantity=quantity,
                            reason=f'استلام من شحنة الوزارة #{shipment.tracking_code}',
                            reference_type='ministry_shipment',
                            reference_id=shipment.id,
                            performed_by=shipment.confirmed_by if hasattr(shipment, 'confirmed_by') else None
                        )
                        
                        added_items.append({
                            'book_id': book_id,
                            'book_name': str(stock.book),
                            'term': term,
                            'quantity': quantity,
                            'new_stock': stock.quantity
                        })
                        
                        logger.info(f'[INVENTORY] Added {quantity} of book #{book_id} ({term}) to {shipment.to_province} from ministry shipment #{shipment.id}')
                        
                    except Exception as e:
                        error_msg = f'خطأ في إضافة الكتاب {book_id}: {str(e)}'
                        logger.exception(f'[INVENTORY] {error_msg}')
                        errors.append(error_msg)
                
                if errors:
                    raise Exception('فشل في إضافة بعض الكتب')
                
                return {
                    'success': True,
                    'message': f'تم إضافة {len(added_items)} كتاب إلى مخزون المحافظة',
                    'added_items': added_items,
                    'errors': []
                }
                
        except Exception as e:
            logger.exception(f'[INVENTORY] Failed to add inventory from ministry shipment #{shipment.id}: {str(e)}')
            return {
                'success': False,
                'message': f'فشل في إضافة الكميات: {str(e)}',
                'added_items': added_items,
                'errors': errors
            }
    
    @staticmethod
    def deduct_inventory_for_school_shipment(shipment) -> Dict[str, Any]:
        """
        خصم الكميات من مخزون المحافظة عند إنشاء شحنة للمدرسة
        
        Args:
            shipment: ProvinceToSchoolShipment كائن الشحنة
            
        Returns:
            dict: نتيجة العملية
        """
        if not shipment or not shipment.books:
            return {
                'success': False,
                'message': 'لا توجد كتب في الشحنة',
                'deducted_items': [],
                'errors': ['books field is empty']
            }
        
        if not shipment.from_province:
            return {
                'success': False,
                'message': 'مستودع المحافظة المصدر غير محدد',
                'deducted_items': [],
                'errors': ['source province warehouse not found']
            }
        
        deducted_items = []
        errors = []
        
        try:
            with transaction.atomic():
                for book_item in shipment.books:
                    book_id = int(book_item.get('book_id'))
                    quantity = int(book_item.get('quantity'))
                    term = book_item.get('term')
                    
                    try:
                        stock = WarehouseStock.objects.select_for_update().get(
                            province_warehouse=shipment.from_province,
                            book_id=book_id,
                            term=term
                        )
                        
                        # التحقق من توفر الكمية
                        if stock.quantity < quantity:
                            error_msg = f'الكمية غير كافية للكتاب {stock.book}: متوفر {stock.quantity} مطلوب {quantity}'
                            logger.warning(f'[INVENTORY] {error_msg} - School Shipment #{shipment.id}')
                            errors.append(error_msg)
                            continue
                        
                        # خصم الكمية
                        stock.quantity -= quantity
                        stock.save()
                        
                        # تسجيل الحركة
                        StockMovement.objects.create(
                            warehouse_stock=stock,
                            movement_type='out',
                            quantity=quantity,
                            reason=f'شحنة للمدرسة #{shipment.tracking_code}',
                            reference_type='school_shipment',
                            reference_id=shipment.id,
                            performed_by=shipment.created_by if hasattr(shipment, 'created_by') else None
                        )
                        
                        deducted_items.append({
                            'book_id': book_id,
                            'book_name': str(stock.book),
                            'term': term,
                            'quantity': quantity,
                            'remaining_stock': stock.quantity
                        })
                        
                        logger.info(f'[INVENTORY] Deducted {quantity} of book #{book_id} ({term}) from {shipment.from_province} for school shipment #{shipment.id}')
                        
                    except WarehouseStock.DoesNotExist:
                        error_msg = f'الكتاب {book_id} ({term}) غير موجود في مخزون المحافظة'
                        logger.error(f'[INVENTORY] {error_msg}')
                        errors.append(error_msg)
                    except Exception as e:
                        error_msg = f'خطأ في خصم الكتاب {book_id}: {str(e)}'
                        logger.exception(f'[INVENTORY] {error_msg}')
                        errors.append(error_msg)
                
                if errors:
                    raise Exception('فشل في خصم بعض الكتب')
                
                return {
                    'success': True,
                    'message': f'تم خصم {len(deducted_items)} كتاب من المخزون',
                    'deducted_items': deducted_items,
                    'errors': []
                }
                
        except Exception as e:
            logger.exception(f'[INVENTORY] Failed to deduct inventory for school shipment #{shipment.id}: {str(e)}')
            return {
                'success': False,
                'message': f'فشل في خصم الكميات: {str(e)}',
                'deducted_items': deducted_items,
                'errors': errors
            }
