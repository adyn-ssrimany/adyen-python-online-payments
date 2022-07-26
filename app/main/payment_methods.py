import Adyen
import json
import uuid
from main.config import get_adyen_api_key, get_adyen_merchant_account

'''
Get payment methods by calling the /paymentMethods endpoint

Request must provide few mandatory attributes (amount, currency,)

Your backend should have a payment state where you can fetch information like amount and shopperReference

Parameters
    ----------
    host_url : string
        URL of the host (i.e. http://localhost:8080): required to define returnUrl parameter
'''
def adyen_payment_methods(host_url,data):
    
    adyen = Adyen.Adyen()
    adyen.payment.client.xapikey = get_adyen_api_key()
    adyen.payment.client.platform = "test" # change to live for production
    adyen.payment.client.merchant_account = get_adyen_merchant_account()

    request = {}

    request['amount'] = {"value": "1000", "currency": data["currency"]}
    request['countryCode'] = data["country"]
    request['shopperReference'] = f"Reference da356326-7f57-4341-b81c-a8546e8916y7"

    print("/payment methods request:\n" + json.dumps(request))

    print("**********************************************************************************")

    result = adyen.checkout.payment_methods(request)

    formatted_response = json.dumps((json.loads(result.raw_response)))
    print("/payment methods response:\n" + formatted_response)

    print("**********************************************************************************")

    return formatted_response
