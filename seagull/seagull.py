import json

from seagull_coin import SeagullCoin
from coin_gecko import CoinGecko
from seagull_config import SeagullConfig, SeagullConfigSchema


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
            coins.append(SeagullCoin(coin, self))
        return coins

    @property
    def target_coins(self):
        if len(self.config.inclusions) > 0:
            return self.config.inclusions
        else:
            unexcluded_coins = [
                coin for coin in self.coin_data if coin.is_excluded is False
            ]
            return unexcluded_coins[0 : self.config.top_count]

    @property
    def additional_holdings(self):
        """Return held coins that are not also targets."""
        return [
            coin
            for coin in self.coin_data
            if coin.holding_units > 0 and coin not in self.target_coins
        ]

    @property
    def total_investment(self):
        return (
            sum([coin.holding_value for coin in self.coin_data])
            + self.config.base_currency_to_invest
        )

    @property
    def target_coins_market_cap(self):
        return sum([coin.market_cap for coin in self.target_coins])
