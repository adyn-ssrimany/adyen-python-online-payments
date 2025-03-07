import Adyen
import json
import uuid
from main.config import get_adyen_api_key, get_adyen_merchant_account

'''
Create Payment Session by calling /sessions endpoint

Request must provide few mandatory attributes (amount, currency, returnUrl, transaction reference)

Your backend should have a payment state where you can fetch information like amount and shopperReference

Parameters
    ----------
    host_url : string
        URL of the host (i.e. http://localhost:8080): required to define returnUrl parameter
'''
def adyen_sessions(host_url,data):
    
    adyen = Adyen.Adyen()
    adyen.payment.client.xapikey = get_adyen_api_key()
    adyen.payment.client.platform = "test" # change to live for production
    adyen.payment.client.merchant_account = get_adyen_merchant_account()

    request = {}


    request['amount'] = {"value": "1000", "currency": data["currency"]}
    request['reference'] = f"Reference {uuid.uuid4()}"  # provide your unique payment reference
    #request['shopperReference'] = f"Reference {uuid.uuid4()}"
    request['shopperReference'] = f"Reference da356326-7f57-4341-b81c-a8546e8916y7"
    request['shopperInteraction'] = "Ecommerce"
    if 'nonCardStorePayment' in data:
        request['storePaymentMethod'] = data['nonCardStorePayment']
        if (data ['nonCardStorePayment']) == 'true':
            request['recurringProcessingModel'] = data['recurringProcessingModel']
     
    # set redirect URL required for some payment methods
    request['returnUrl'] = f"{host_url}redirect?shopperOrder=myRef"
    request['countryCode'] = data["country"]
    lineItems = [ { "quantity": "1", "description": "SunGlasses","id": "Item #1","amountIncludingTax": "500",},{"quantity": "1","description": "Shoes","id": "Item #2","amountIncludingTax": "500"}]
    request['lineItems']=lineItems
    request['shopperEmail'] = "ssrimany@yopmail.com"
    request['shopperLocale'] = "en_NL"
    request['shopperName'] = {"firstName": "John","gender":"UNKNOWN","lastName": "Smith"}
    request['billingAddress'] = {"city": "London", "country": "GB","houseNumberOrName": "12-13 Wells Street","postalCode": "W1T 3PA"}
    request['deliveryAddress'] = {"city": "Amsterdam", "country": "NL","houseNumberOrName": "25","postalCode": "123456","street": "Simpson Road"}
    

    print("/sessions request:\n" + json.dumps(request))

    print("**********************************************************************************")

    result = adyen.checkout.sessions(request)

    formatted_response = json.dumps((json.loads(result.raw_response)))
    print("/sessions response:\n" + formatted_response)

    print("**********************************************************************************")

    return formatted_response
