## Overview

The `models` sub-package contains `TelepModel` class and associated exceptions
that are responsible for feature transformation, prediction, and model
validation.

## Examples

```
# instantiation
xgb_model = XGBClassifier()
xgb_model.load_model('model.json')
transformer = pickle.load(open('transformer.pkl', 'rb'))
telep_model = TelepModel(model=xgb_model, transformer=transformer)

# prediction on X_df
X_transformed = telep_model.transform_features(X_df)
predicted_proba = telep_model.predict(X_transformed)

# model validation raises exceptions if it fails
telep_model.validate(X_test, y_test, tolerance=0.05)
```

`TelepModel` is mainly used in the Tele-p ML service and likely not during
model development.
