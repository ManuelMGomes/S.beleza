from pydantic import BaseModel


class ProductBase(BaseModel):
    name: str
    category: str
    price: int
    stock: int
    min_stock: int
    active: bool = True


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductOut(BaseModel):
    id: str
    name: str
    category: str
    price: int
    stock: int
    min_stock: int
    active: bool
