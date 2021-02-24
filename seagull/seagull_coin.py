from decimal import Decimal
from typing import Dict


class SeagullCoin:
    def __init__(self, raw_market_data: Dict, seagull):
        self.id = raw_market_data["id"]
        self.symbol = raw_market_data["symbol"]
        self.name = raw_market_data["name"]
        self.image_url = raw_market_data["image"].replace("/large/", "/thumb/")
        self.current_price = Decimal(raw_market_data["current_price"])
        self.market_cap = Decimal(raw_market_data["market_cap"])

        self.seagull = seagull

    @property
    def is_excluded(self):
        return True if self.id in self.seagull.config.exclusions else False

    @property
    def holding_units(self):
        return (
            Decimal(0)
            if self.id not in self.seagull.config.holding_coin_ids
            else self.seagull.config.holdings[self.id]
        )

    @property
    def holding_value(self):
        return self.holding_units * self.current_price

    @property
    def target_pct(self):
        if self in self.seagull.target_coins:
            return self.market_cap / self.seagull.target_coins_market_cap
        else:
            return Decimal(0)

    @property
    def target_units(self):
        if self in self.seagull.target_coins:
            return (
                (self.seagull.total_investment * self.target_pct)
                / self.current_price
            ).quantize(Decimal(".00000001"))
        else:
            return Decimal(0)

    @property
    def target_units_diff(self):
        return self.target_units - self.holding_units

    @property
    def target_units_diff_value(self):
        return self.target_units_diff * self.current_price
