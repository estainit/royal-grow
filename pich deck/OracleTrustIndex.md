### Calculating the MarketTrustIndex

To calculate this variable, you can follow these steps:

1. **Collect Exchange Rate Data** : Gather the USD/EUR exchange rate data from the 10 semi-trusted exchanges for the past 48 hours.
2. **Calculate Volatility** : Determine the volatility of the exchange rates over the 48-hour period. This can be done using statistical measures such as the standard deviation or variance of the exchange rates.
3. **Compare Exchange Data** : Compare the exchange rates provided by the 10 exchanges. If the rates from different exchanges vary significantly, it might indicate potential manipulation.
4. **Deviation from Average** : Calculate the average exchange rate from all exchanges at each time point. Then measure how much each exchange's rate deviates from this average.
5. **Suspicion Score** : Assign a suspicion score to each exchange based on how much its rates deviate from the average. Higher deviations might indicate manipulation.
6. **Aggregate Suspicion Scores** : Combine the suspicion scores from all exchanges to create an overall trust index. The formula might look something like this:

MarketTrustIndex=1−(∑𝑖=1𝑛DeviationScore𝑖𝑛)**MarketTrustIndex**=**1**−**(**n**∑**i**=**1**n\*\***DeviationScore**i\*\*\*\***)\*\*

Where:

- 𝑛**n** is the number of exchanges (10 in this case).
- DeviationScore𝑖**DeviationScore**i is the deviation score for exchange 𝑖**i**, normalized to a value between 0 and 1.

A lower MarketTrustIndex would indicate higher suspicion of manipulation and less market stability, whereas a higher index would indicate more stability and higher trust in the data.

### Example Implementation in Pseudocode

We'll define the levels of trust as follows:

- **1** : Very Low Trust
- **2** : Low Trust
- **3** : Medium Trust
- **4** : High Trust
- **5** : Very High Trust

We'll map the `market_trust_index` to these levels by defining thresholds for each level.

Here's the updated code:

```



def calculate_market_trust_indexZZ(exchange_data):
    # exchange_data is a dictionary where keys are exchange names and values are lists of exchange rates

    n = len(exchange_data)  # number of exchanges
    time_points = len(next(iter(exchange_data.values())))  # number of time points

    # Calculate the average exchange rate at each time point
    average_rates = []
    for t in range(time_points):
        avg_rate = sum(exchange_data[exchange][t] for exchange in exchange_data) / n
        average_rates.append(avg_rate)

    # Calculate deviation scores for each exchange
    deviation_scores = {exchange: 0 for exchange in exchange_data}
    for exchange in exchange_data:
        for t in range(time_points):
            deviation_scores[exchange] += abs(exchange_data[exchange][t] - average_rates[t]) / average_rates[t]
        deviation_scores[exchange] /= time_points  # normalize by number of time points

    # Calculate the MarketTrustIndex
    total_deviation_score = sum(deviation_scores[exchange] for exchange in exchange_data)
    market_trust_index = 1 - (total_deviation_score / n)

    return market_trust_index

# Example usage with dummy data
exchange_data = {
    "ExchangeA": [1.1, 1.2, 1.1, 1.3, ...],  # exchange rates over time
    "ExchangeB": [1.1, 1.2, 1.1, 1.3, ...],
    # ...
    "ExchangeJ": [1.1, 1.2, 1.1, 1.3, ...]
}

market_trust_index = calculate_market_trust_index(exchange_data)
print("Market Trust Index:", market_trust_index)




def calculate_oracle_trust_index(exchange_data):
    # exchange_data is a dictionary where keys are exchange names and values are lists of exchange rates    n = len(exchange_data)  # number of exchanges
    time_points = len(next(iter(exchange_data.values())))  # number of time points    # Calculate the average exchange rate at each time point
    average_rates = []
    for t in range(time_points):
        avg_rate = sum(exchange_data[exchange][t] for exchange in exchange_data) / n
        average_rates.append(avg_rate)    # Calculate deviation scores for each exchange
    deviation_scores = {exchange: 0 for exchange in exchange_data}
    for exchange in exchange_data:
        for t in range(time_points):
            deviation_scores[exchange] += abs(exchange_data[exchange][t] - average_rates[t]) / average_rates[t]
        deviation_scores[exchange] /= time_points  # normalize by number of time points    # Calculate the MarketTrustIndex
    total_deviation_score = sum(deviation_scores[exchange] for exchange in exchange_data)
    market_trust_index = 1 - (total_deviation_score / n)    return market_trust_indexdef map_to_enum(market_trust_index):
    # Define thresholds for the levels of trust
    if market_trust_index >= 0.8:
        return 5  # Very High Trust
    elif market_trust_index >= 0.6:
        return 4  # High Trust
    elif market_trust_index >= 0.4:
        return 3  # Medium Trust
    elif market_trust_index >= 0.2:
        return 2  # Low Trust
    else:
        return 1  # Very Low TrustExample usage with dummy dataexchange_data = {
    "ExchangeA": [1.1, 1.2, 1.1, 1.3],  # exchange rates over time
    "ExchangeB": [1.1, 1.2, 1.1, 1.3],
    # ...
    "ExchangeJ": [1.1, 1.2, 1.1, 1.3]
}

market_trust_index = calculate_market_trust_index(exchange_data)
market_trust_index_enum = map_to_enum(market_trust_index)
print("Market Trust Index:", market_trust_index)
print("Market Trust Index Enum:", market_trust_index_enum)
```

i want to name a variable which indicate to market stablitiy in different point of view. that is we watch the currency pair price e.g. USD/EUR in last 48 hours. these information are made by 10 semi trusted exchanges. if we found the exchange rate is changing dramatically it means there is a possibility that these 10 exchange are betrying and feeding wrong info in order to manipulate the market on my app. so i need an index variable to show the level of trust/betry of the data sources. what shoud i name this variable, since this variable indirectly shows also the market stablity? and how can i calculate this variable?
