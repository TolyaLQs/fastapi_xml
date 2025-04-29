# routers/admin.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import SessionLocal
import app.models as models
from pydantic import BaseModel
from typing import Optional, Union
from sqlalchemy import and_
from app.routers import parse
router = APIRouter()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Pydantic models
class SiteBase(BaseModel):
    name: str
    url: str
    filename: str


class SiteCreate(SiteBase):
    pass


class SiteUpdate(SiteBase):
    pass


@router.delete("/sites/{site_id}")
def delete_site(site_id: int, db: Session = Depends(get_db)):
    site = db.query(models.Site).filter(models.Site.id == site_id).first()
    if not site:
        return {'status-code': 400, 'detail': "Site not found"}
    categories = db.query(models.Category).filter(models.Category.site_id == site_id).all()
    for category in categories:
        products = db.query(models.Product).filter(models.Product.category_id == category.id).all()
        for product in products:
            db.delete(product)
        descriptions = db.query(models.Description).filter(models.Description.category_id == category.id).all()
        for description in descriptions:
            db.delete(description)
        time_marks = db.query(models.TimeMark).filter(models.TimeMark.site_id == site_id).all()
        for time_mark in time_marks:
            db.delete(time_mark)
        db.delete(category)
    db.delete(site)
    db.commit()
    return {'status-code': 200, 'detail': 'Site update'}


@router.put("/sites/{site_id}")
def update_site(site_id: int, site: SiteUpdate, db: Session = Depends(get_db)):
    db_site = db.query(models.Site).filter(models.Site.id == site_id).first()
    if not db_site:
        return {'status-code': 400, 'detail': "Site not found"}

    for key, value in site.dict().items():
        setattr(db_site, key, value)

    db.commit()
    db.refresh(db_site)
    return {'status-code': 200, 'detail': 'Site update'}


# CRUD operations for Sites
@router.post("/sites/")
def create_site(site: SiteCreate, db: Session = Depends(get_db)):
    if site.dict()['url'] == '':
        return {'status-code': 400, 'detail': "Url must be empty"}
    if site.dict()['name'] == '':
        return {'status-code': 400, 'detail': "Name must be empty"}
    if site.dict()['filename'] == '':
        site.dict()['filename'] = f'{site.dict()["name"]}.xml'
    db_site = models.Site(**site.dict())
    db.add(db_site)
    db.commit()
    db.refresh(db_site)
    return {'status-code': 200, 'detail': 'Site created'}


@router.get("/sites/")
def read_sites(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return db.query(models.Site).offset(skip).limit(limit).all()
    except:
        return {'status-code': 400, 'detail': "Sites not found"}


def all_sites(db: Session = Depends(get_db)):
    return db.query(models.Site).all()


@router.get("/site/{site_id}")
def read_site(site_id: int, db: Session = Depends(get_db)):
    try:
        site = db.query(models.Site).filter(models.Site.id == site_id).first()
        categories = db.query(models.Category).filter(models.Category.site_id == site_id).all()
        for category in categories:
            category.products = db.query(models.Product).filter(models.Product.category_id == category.id).all()
            category.descriptions = db.query(models.Description).filter(
                models.Description.category_id == category.id).all()
            try:
                category.parent = db.query(models.Category).filter(models.Category.id == category.parent_id).first()
            except:
                category.parent = {'name': '-'}
        context = {'status-code': 200, "site": site, "categories": categories}
        db.close()
        return context
    except:
        return {'status-code': 400, 'detail': "Site not found"}


# Аналогичные CRUD операции для остальных моделей (Category, Product, Description, TimeMark)
# Реализация аналогична вышеописанной для Sites

class CategoryBase(BaseModel):
    name: str
    parent_id: Union[int, None]
    site_id: int


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


@router.delete("/categories/{category_id}")
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not category:
        return {'status-code': 400, 'detail': "Category not found"}
    products = db.query(models.Product).filter(models.Product.category_id == category_id).all()
    for product in products:
        db.delete(product)
    descriptions = db.query(models.Description).filter(models.Description.category_id == category_id).all()
    for description in descriptions:
        db.delete(description)
    db.delete(category)
    db.commit()
    return {'status-code': 200, 'detail': 'Category deleted'}


@router.put("/categories/{category_id}")
def update_category(category_id: int, category: CategoryUpdate, db: Session = Depends(get_db)):
    db_category = db.query(models.Category).filter(models.Category.id == category_id).first()
    if not db_category:
        return {'status-code': 400, 'detail': "Category not found"}
    for key, value in category.dict().items():
        setattr(db_category, key, value)
    db.commit()
    db.refresh(db_category)
    return {'status-code': 200, 'detail': 'Category update'}


@router.post("/categories/")
def create_category(category: CategoryCreate, db: Session = Depends(get_db)):
    if category.dict()['name'] == '':
        return {'status-code': 400, 'detail': "Name must be empty"}
    if category.dict()['parent_id']:
        parent = db.query(models.Category).filter(models.Category.id == category.dict()['parent_id']).first()
        if not parent:
            return {'status-code': 400, 'detail': "Parent category not found"}
    if category.dict()['site_id']:
        site = db.query(models.Site).filter(models.Site.id == category.dict()['site_id']).first()
        if not site:
            return {'status-code': 400, 'detail': "Site not found"}
    else:
        return {'status-code': 400, 'detail': "Site must be specified"}
    unic = db.query(models.Category).filter(and_(models.Category.name == category.dict()['name'], models.Category.site_id == category.dict()['site_id'])).first()
    if unic:
        return {'status-code': 400, 'detail': "Category with this name already exists"}
    db_category = models.Category(**category.dict())
    db.add(db_category)
    db.commit()
    db.refresh(db_category)
    return {'status-code': 200, 'detail': 'Category created'}


@router.get("/categories/")
def read_categories(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return db.query(models.Category).offset(skip).limit(limit).all()
    except:
        return {'status-code': 400, 'detail': "Categories not found"}


class ProductBase(BaseModel):
    name: str
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


@router.delete("/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return {'status-code': 400, 'detail': "Product not found"}
    db.delete(product)
    db.commit()
    return {'status-code': 200, 'detail': 'Product deleted'}


@router.put("/products/{product_id}")
def update_product(product_id: int, product: ProductUpdate, db: Session = Depends(get_db)):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        return {'status-code': 400, 'detail': "Product not found"}
    for key, value in product.dict().items():
        setattr(db_product, key, value)
    db.commit()
    db.refresh(db_product)
    return {'status-code': 200, 'detail': 'Product update', 'db_product': db_product}


@router.post("/products/")
def create_product(product: ProductBase, db: Session = Depends(get_db)):
    if product.dict()['name'] == '':
        return {'status-code': 400, 'detail': "Name must be empty"}
    if product.dict()['category_id']:
        category = db.query(models.Category).filter(models.Category.id == product.dict()['category_id']).first()
        if not category:
            return {'status-code': 400, 'detail': "Category not found"}
    else:
        return {'status-code': 400, 'detail': "Category must be specified"}
    unit = db.query(models.Product).filter(and_(models.Product.name == product.dict()['name'], models.Product.category_id == product.dict()['category_id'])).first()
    if unit:
        print(unit.name)
        return {'status-code': 400, 'detail': "Product with this name already exists"}
    db_product = models.Product(**product.dict())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return {'status-code': 200, 'detail': 'Category created', 'db_product': db_product}


@router.get("/products/")
def read_products(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return db.query(models.Product).offset(skip).limit(limit).all()
    except:
        return {'status-code': 400, 'detail': "Products not found"}


class DescriptionBase(BaseModel):
    text: str
    category_id: int


class DescriptionCreate(DescriptionBase):
    pass


class DescriptionUpdate(DescriptionBase):
    pass


@router.delete("/descriptions/{description_id}")
def delete_description(description_id: int, db: Session = Depends(get_db)):
    description = db.query(models.Description).filter(models.Description.id == description_id).first()
    if not description:
        return {'status-code': 400, 'detail': "Description not found"}
    db.delete(description)
    db.commit()
    return {'status-code': 200, 'detail': 'Description deleted'}


@router.put("/descriptions/{description_id}")
def update_description(description_id: int, description: DescriptionUpdate, db: Session = Depends(get_db)):
    db_description = db.query(models.Description).filter(models.Description.id == description_id).first()
    if not db_description:
        return {'status-code': 400, 'detail': "Description not found"}
    for key, value in description.dict().items():
        setattr(db_description, key, value)
    db.commit()
    db.refresh(db_description)
    return {'status-code': 200, 'detail': 'Description update'}


@router.post("/descriptions/")
def create_description(description: DescriptionBase, db: Session = Depends(get_db)):
    if description.dict()['text'] == '':
        return {'status-code': 400, 'detail': "Text must be empty"}
    if description.dict()['category_id']:
        category = db.query(models.Category).filter(models.Category.id == description.dict()['category_id']).first()
        if not category:
            return {'status-code': 400, 'detail': "Category not found"}
    else:
        return {'status-code': 400, 'detail': "Category must be specified"}
    unit = db.query(models.Description).filter(and_(models.Description.text == description.dict()['text'], models.Description.category_id == description.dict()['category_id'])).first()
    if unit:
        return {'status-code': 400, 'detail': "Description with this text already exists"}
    db_description = models.Description(**description.dict())
    db.add(db_description)
    db.commit()
    db.refresh(db_description)
    return db_description


@router.get("/descriptions/")
def read_descriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return db.query(models.Description).offset(skip).limit(limit).all()
    except:
        return {'status-code': 400, 'detail': "Descriptions not found"}


class TimeMarkBase(BaseModel):
    day_of_week: int
    hour: int
    minute: int
    site_id: int


class TimeMarkCreate(TimeMarkBase):
    pass


class TimeMarkUpdate(TimeMarkBase):
    pass


@router.delete("/timemarks/{timemark_id}")
def delete_timemark(timemark_id: int, db: Session = Depends(get_db)):
    timemark = db.query(models.TimeMark).filter(models.TimeMark.id == timemark_id).first()
    if not timemark:
        return {'status-code': 400, 'detail': "Timemark not found"}
    db.delete(timemark)
    db.commit()
    return {'status-code': 200, 'detail': 'Timemark deleted'}


@router.put("/timemarks/{timemark_id}")
def update_timemark(timemark_id: int, timemark: TimeMarkUpdate, db: Session = Depends(get_db)):
    db_timemark = db.query(models.TimeMark).filter(models.TimeMark.id == timemark_id).first()
    if not db_timemark:
        return {'status-code': 400, 'detail': "Timemark not found"}
    for key, value in timemark.dict().items():
        setattr(db_timemark, key, value)
    db.commit()
    db.refresh(db_timemark)
    return {'status-code': 200, 'detail': 'Timemark update'}


@router.post("/timemarks/")
def create_timemark(timemark: TimeMarkBase, db: Session = Depends(get_db)):
    if timemark.dict()['site_id']:
        site = db.query(models.Site).filter(models.Site.id == timemark.dict()['site_id']).first()
        if not site:
            return {'status-code': 400, 'detail': "Site not found"}
    else:
        return {'status-code': 400, 'detail': "Site must be specified"}
    if timemark.dict()['day_of_week'] < 0 or timemark.dict()['day_of_week'] > 6:
        return {'status-code': 400, 'detail': "Day of week must be between 0 and 6"}
    if timemark.dict()['hour'] < 0 or timemark.dict()['hour'] > 23:
        return {'status-code': 400, 'detail': "Hour must be between 0 and 23"}
    if timemark.dict()['minute'] < 0 or timemark.dict()['minute'] > 59:
        return {'status-code': 400, 'detail': "Minute must be between 0 and 59"}
    db_timemark = models.TimeMark(**timemark.dict())
    db.add(db_timemark)
    db.commit()
    db.refresh(db_timemark)
    return db_timemark


@router.get("/timemarks/")
def read_timemarks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    try:
        return db.query(models.TimeMark).offset(skip).limit(limit).all()
    except:
        return {'status-code': 400, 'detail': "Timemarks not found"}


@router.get("/site-parse/{site_id}")
def site_parse(site_id: int, db: Session = Depends(get_db)):
    try:
        site = db.query(models.Site).filter(models.Site.id == site_id).first()
        print('получили сайт')
    except:
        return {'status-code': 400, 'detail': "Site not found"}
    list_cat = parse.all_list_kat
    i = 0
    print('начинаем парсить категории')
    for cat in list_cat:
        try:
            category = db.query(models.Category).filter(models.Category.name == cat['title']).first()
            print('получили категорию')
        except:
            print(f'проблема с категорией {cat["title"]}')
        parent_cat = db.query(models.Category).filter(models.Category.name == cat['parent_id']).first()
        if parent_cat:
            category = models.Category(name=cat['title'], site_id=site_id, parent_id=parent_cat.id)
        else:
            category = models.Category(name=cat['title'], site_id=site_id)
        db.add(category)
        db.commit()
        db.refresh(category)
        print(f'количество категорий: {i}')
        i += 1
