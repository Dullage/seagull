from urllib.parse import urljoin

import requests


class CoinGecko:
    BASE_URL = "https://api.coingecko.com"

    @classmethod
    def get_market_data(cls, base_currency, coin_ids=[], per_page=100, page=1):
        url = urljoin(cls.BASE_URL, "/api/v3/coins/markets")
        params = {
            "vs_currency": base_currency,
            "order": "market_cap_desc",
            "per_page": per_page,
            "page": page,
        }
        if len(coin_ids) > 0:
            params["ids"] = ",".join(coin_ids)
        r = requests.get(url, params=params)
        return r.json()

    @classmethod
    def list_coins(cls):
        url = urljoin(cls.BASE_URL, "/api/v3/coins/list")
        r = requests.get(url)
        return r.json()
