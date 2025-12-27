export interface Product {
    _id?: string;
    code: string;
    description: string;
    packaging: string;
    price: string;
    unitPrice: string;
    barcode: string;
    ipi: string;
    category: Category;
    supplier: Supplier;
    quantityStock: number;
    imagePaths: string[];
    disable: boolean;
  }

export interface Category {
  _id: string;
  name: string;
}

export interface User extends Person {
  _id?: string;
  email: string;
  pasword: string;
  profileId: number;
  isActive : boolean;
}

export interface Person {
  name: string;
  telephone: string;
}

export interface Address {
  _id?: string,
  street: string;
  number: string;
  cep: string;
  city: string;
  uf: string;
  neighborhood: string;
  complement: string;
}

export interface Register {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface Supplier {
  _id: string;
  name: string;
}

export interface Payments {
  id: string;
  name: string;
  checked: boolean;
}

  export interface Order {
    _id?: string;
    numberOrder: number;
    createdAt?: string;
    itemsOrder: (CartItem | string | undefined)[];
    totalPrice: number;
    quantityItems: number;
    statusOrder: string;
    client: User | string | undefined;
    payments?: Payments[];
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string | Date;
  }
  
  export interface OrderRequest {
    _id?: string;
    quantity: number;
  }
  
  export interface OrderResponse {
    _id?: string;
    numberOrder: number;
    createdAt?: string;
    itemsOrder: CartItemResponse[];
    totalPrice: number;
    quantityItems: number;
    statusOrder: string;
    client: User | string | undefined;
    payments?: Payments[];
  }

export interface CartItemResponse {
  product:  Product;
  quantity: number;
}

export interface CartItem extends Product {
  product: any;
  quantity: number;
}

export enum Role {
  adm = "ADM",
  client = "CLIENT",
}
