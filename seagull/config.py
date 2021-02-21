from marshmallow import fields, Schema, post_load
from decimal import Decimal


class SeagullConfigSchema(Schema):
    base_currency = fields.Str(missing="usd")
    base_currency_to_invest = fields.Decimal(
        missing=Decimal(0), as_string=True
    )
    holdings = fields.Dict(
        keys=fields.Str(),
        values=fields.Decimal(as_string=True),
        missing={},
    )
    top_count = fields.Int(missing=10)
    inclusions = fields.List(fields.Str(), missing=[])
    exclusions = fields.List(fields.Str(), missing=[])

    @post_load
    def make_config(self, data, **kwargs):
        return SeagullConfig(**data)


class SeagullConfig:
    def __init__(
        self,
        base_currency,
        base_currency_to_invest,
        holdings,
        top_count,
        inclusions,
        exclusions,
    ):
        self.base_currency = base_currency
        self.base_currency_to_invest = base_currency_to_invest
        self.holdings = holdings
        self.top_count = top_count
        self.inclusions = inclusions
        self.exclusions = exclusions

    @property
    def holding_coin_ids(self):
        return self.holdings.keys()

    @property
    def num_exclusions(self):
        return len(self.exclusions)
