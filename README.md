# Project Overview

The purpose of this project is to apply the principle of arbitrage by buying/selling at the same time in two different markets. Currently, the two "market" targets are `IBKR` & `OANDA`.

We've found that `OANDA`'s forex currency pair data is delayed and differs from that of `IBKR` which we can exploit and make a profit if the difference gap is large enough.

## TWS/IBGateway API
For access to trading APIs on IBKR side, we leverage [gnzsnz/ib-gateway](https://github.com/gnzsnz/ib-gateway-docker) for a containerized version of ib-gateway.

## Running this project
.env file is necessary for the running of this project. Ensure `ib-gateway` container is running, then run main.ts as needed.
```bash
# OANDA credentials
API_KEY=
ACCOUNT_ID =

# IB gateway container envs
TWS_USERID=
TWS_PASSWORD=
TRADING_MODE=
READ_ONLY_API=
```

### Run IBGateway
```bash
docker compose up -d
```
