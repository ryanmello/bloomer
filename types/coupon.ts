export type Coupon = {
  id: string;
  codeName: string;
  discount: number;
  validUntil: string;
  description: string | null;
};
