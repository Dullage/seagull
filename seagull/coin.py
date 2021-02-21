from decimal import Decimal
from typing import Dict

from config import SeagullConfig


class Coin:
    def __init__(self, raw_market_data: Dict, config: SeagullConfig):
        self.id = raw_market_data["id"]
        self.symbol = raw_market_data["symbol"]
        self.name = raw_market_data["name"]
        self.image_url = raw_market_data["image"]
        self.current_price = raw_market_data["current_price"]
        self.market_cap = raw_market_data["market_cap"]

        self.config = config

    @property
    def excluded(self):
        return True if self.id in self.config.exclusions else False

    @property
    def holding(self):
        return (
            Decimal(0)
            if self.id not in self.config.holding_coin_ids
            else self.config.holdings[self.id]
        )
