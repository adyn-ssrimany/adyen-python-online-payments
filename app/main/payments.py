import Adyen
import json
import uuid
from main.config import get_adyen_api_key, get_adyen_merchant_account

'''
Making the payments calling the /payments endpoint

Request must provide the mandatory attributes fror making a payment

Your backend should have a payment state where you can fetch information like amount and shopperReference

Parameters
    ----------
    host_url : string
        URL of the host (i.e. http://localhost:8080): required to define returnUrl parameter
'''
def adyen_payments(host_url,data):
    
    adyen = Adyen.Adyen()
    adyen.payment.client.xapikey = get_adyen_api_key()
    adyen.payment.client.platform = "test" # change to live for production
    adyen.payment.client.merchant_account = get_adyen_merchant_account()

    request = {}

    request['amount'] = {"value": "1000", "currency": data["currency"]}
    request['countryCode'] = data["country"]
    request['paymentMethod'] = data['paymentMethod']
    #request['shopperIP'] = "185.38.113.213",
    #request['shopperIP'] = "31.31.159.123",
    #request['mandate']={ "amount":"1000", "frequency":"monthly", "endsAt":"2022-12-22"}


    if 'storePaymentMethod' in data:
        request['storePaymentMethod'] = data['storePaymentMethod']
        if json.dumps(data['storePaymentMethod']) == 'true':
            request['recurringProcessingModel'] = data['recurringProcessingModel']

    

    if 'nonCardStorePayment' in data:
        request['storePaymentMethod'] = data['nonCardStorePayment']
        if (data ['nonCardStorePayment']) == 'true':
            request['recurringProcessingModel'] = data['recurringProcessingModel']

    
    

    if 'browserInfo' in data:
        request['authenticationData']={
            'threeDSRequestData': {
                'nativeThreeDS': 'preferred'
            }
        }
        request['browserInfo'] = data['browserInfo']
        request['origin'] = f"{host_url}checkout"
    request['reference'] = f"Reference {uuid.uuid4()}"  # provide your unique payment reference
    # set redirect URL required for some payment methods
    request['returnUrl'] = f"{host_url}redirect?shopperOrder=myRef"
    lineItems = [ { "quantity": "1", "description": "SunGlasses","id": "Item #1","amountIncludingTax": "500",},{"quantity": "1","description": "Shoes","id": "Item #2","amountIncludingTax": "500"}]
    request['lineItems']=lineItems
    request['shopperEmail'] = "ssrimany@yopmail.com"
    request['shopperReference'] = f"Reference da356326-7f57-4341-b81c-a8546e8916y7"
    request['shopperLocale'] = "en_NL"
    request['channel'] = "Web"
    request['shopperName'] = {"firstName": "John","gender":"UNKNOWN","lastName": "Smith"}
    request['billingAddress'] = {"city": "Amsterdam", "country": "NL","houseNumberOrName": "25","postalCode": "123456","street": "Simpson Road"}
    request['deliveryAddress'] = {"city": "Amsterdam", "country": "NL","houseNumberOrName": "25","postalCode": "123456","street": "Simpson Road"}
    

    print("/payments request:\n" + json.dumps(request))

    print("**********************************************************************************")

    result = adyen.checkout.payments(request)

    formatted_response = json.dumps((json.loads(result.raw_response)))
    print("/payments response:\n" + formatted_response)

    print("**********************************************************************************")

    return formatted_response
