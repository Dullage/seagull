import json

from flask import Flask, render_template

from seagull import Seagull, SeagullConfigSchema

app = Flask(__name__)

with open("config.json", "r") as f:
    config_json = json.load(f)
    config = SeagullConfigSchema().load(config_json)


@app.route("/")
def index():
    seagull = Seagull(config)
    return render_template("index.html", seagull=seagull)
