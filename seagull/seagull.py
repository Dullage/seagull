import json

from coin import Coin
from coin_gecko import CoinGecko
from config import SeagullConfig, SeagullConfigSchema


class Seagull:
    def __init__(self, config: SeagullConfig):
        self.config = config
        self.coin_data = self.get_coin_data()

    def get_coin_data(self):
        """Get coin data for user. Data collected is minimised but may include
        excluded or surplus coins."""
        # Hand Picked Selection
        if len(self.config.inclusions) > 0:
            coin_ids_required = (
                self.config.inclusions + self.config.holding_coin_ids
            )
            data = CoinGecko.get_market_data(
                self.config.base_currency,
                coin_ids=coin_ids_required,
                per_page=len(coin_ids_required),
            )

        # Top Coins by Market Cap Selection
        else:
            # Get more than needed in case the top coins includes exclusions
            data = CoinGecko.get_market_data(
                self.config.base_currency,
                per_page=self.config.top_count + self.config.num_exclusions,
            )
            # Ensure holdings are also present in the data
            data_coin_ids = [coin["id"] for coin in data]
            missing_coin_ids = [
                coin_id
                for coin_id in self.config.holding_coin_ids
                if coin_id not in data_coin_ids
            ]
            if len(missing_coin_ids) > 0:
                data += CoinGecko.get_market_data(
                    self.config.base_currency,
                    coin_ids=missing_coin_ids,
                    per_page=len(missing_coin_ids),
                )

        coins = []
        for coin in data:
            coins.append(Coin(coin, self.config))
        return coins


def calculate_percentages(market_caps):
    total = sum([currency[1] for currency in market_caps])
    for currency in market_caps:
        print(currency[0], "{:.2%}".format(currency[1] / total))


if __name__ == "__main__":
    with open("config.json", "r") as f:
        config_json = json.load(f)
        config = SeagullConfigSchema().load(config_json)

    seagull = Seagull(config)
    print(seagull)
