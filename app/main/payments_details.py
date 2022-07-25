import Adyen
import json
import uuid
from main.config import get_adyen_api_key, get_adyen_merchant_account

'''
Submit redirect result using the calling the /payments/details endpoint

Request must provide the mandatory attribute redirectResult if action was redirect else for any other action provide state.data


Parameters
    ----------
    host_url : string
        URL of the host (i.e. http://localhost:8080): required to define returnUrl parameter
'''
def adyen_payments_details(host_url,data):
    
    adyen = Adyen.Adyen()
    adyen.payment.client.xapikey = get_adyen_api_key()
    adyen.payment.client.platform = "test" # change to live for production
    adyen.payment.client.merchant_account = get_adyen_merchant_account()

    if "redirectResult" in data:
        request = {}
        request['details'] = data
    else:
        request = data

    print("/payments details request:\n" + json.dumps(request))
    print("**********************************************************************************")
    result = adyen.checkout.payments_details(request)

    formatted_response = json.dumps((json.loads(result.raw_response)))
    print("/payments details response:\n" + formatted_response)

    print("**********************************************************************************")

    return formatted_response
