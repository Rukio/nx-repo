import argparse
import csv
import collections
import json


def to_e6(d):
    return int(round(d * 1e6, 0))


def format_json(market_id, locs):
    return json.dumps(
        {
            "market_id": market_id,
            "locations": {
                "locations": [
                    {
                        "latitude_e6": to_e6(loc[0]),
                        "longitude_e6": to_e6(loc[1]),
                    }
                    for loc in locs
                ],
            },
        },
        indent=2,
    )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--target-market-id", required=True, type=int)
    parser.add_argument("--csv", default="market_rep_locs.csv", type=str)
    args = parser.parse_args()

    target_market_id = args.target_market_id

    market_map = collections.defaultdict(list)

    with open(args.csv) as f:
        r = csv.DictReader(f)
        for line in r:
            market_id = int(line["market_id"])
            locs = market_map[market_id]
            locs.append(
                (float(line["latitude"]), float(line["longitude"])),
            )

    print(format_json(target_market_id, market_map[target_market_id]))


if __name__ == "__main__":
    main()
