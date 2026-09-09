def calculate_pricing(base_price: float, tax_rate: float = 0.05) -> dict:
    tax = round(base_price * tax_rate, 2)
    total = round(base_price + tax, 2)
    return {"base": base_price, "tax": tax, "total": total}
