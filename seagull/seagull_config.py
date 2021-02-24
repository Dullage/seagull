from decimal import Decimal

from marshmallow import Schema, fields, post_load, validate


class SeagullConfigSchema(Schema):
    base_currency = fields.Str(
        validate=validate.OneOf(["usd", "gbp", "eur"]), missing="usd"
    )
    base_currency_to_invest = fields.Decimal(
        missing=Decimal(0), as_string=True
    )
    holdings = fields.Dict(
        keys=fields.Str(),
        values=fields.Decimal(as_string=True),
        missing={},
    )
    top_count = fields.Int(missing=10)
    exclusions = fields.List(fields.Str(), missing=[])

    @post_load
    def make_config(self, data, **kwargs):
        return SeagullConfig(**data)


class SeagullConfig:
    CURRENCY_SYMBOLS = {"usd": "$", "gbp": "£", "eur": "€"}

    def __init__(
        self,
        base_currency,
        base_currency_to_invest,
        holdings,
        top_count,
        exclusions,
    ):
        self.base_currency = base_currency
        self.base_currency_to_invest = base_currency_to_invest
        self.holdings = holdings
        self.top_count = top_count
        self.exclusions = exclusions

    @property
    def holding_coin_ids(self):
        return self.holdings.keys()

    @property
    def num_exclusions(self):
        return len(self.exclusions)

    @property
    def base_currency_symbol(self):
        return self.CURRENCY_SYMBOLS[self.base_currency]
