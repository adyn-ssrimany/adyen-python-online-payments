const clientKey = JSON.parse(document.getElementById('client-key').innerHTML);
const type = JSON.parse(document.getElementById('integration-type').innerHTML);

// Used to finalize a checkout call in case of redirect
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId'); // Unique identifier for the payment session
const redirectResult = urlParams.get('redirectResult');
const country = JSON.parse(document.getElementById('country').innerHTML);
const currency = JSON.parse(document.getElementById('currency').innerHTML);
const nonCardStorePayment = JSON.parse(document.getElementById('storePaymentMethod').innerHTML);
const recurringProcessingModel = JSON.parse(document.getElementById('recurringProcessingModel').innerHTML);


// Start the Checkout workflow
async function startCheckout() {
	try {

        //Get Payment Methods
        const data = {"country":country,"currency":currency}
		const checkoutPaymentMethodResponse = await callServer("/api/payment-methods",data);

        // Create AdyenCheckout using Sessions response
		//const checkout = await createAdyenCheckout(checkoutSessionResponse)

        // Create AdyenCheckout using Payment Methods response
		const checkout = await createAdyenCheckout(checkoutPaymentMethodResponse)

		// Create an instance of Drop-in and mount it to the container you created.
		const dropinComponent = checkout.create(type,{
            //onReady: () => {}, // Drop-in configuration only has props related to itself, like the onReady event. Drop-in configuration cannot contain generic configuration like the onError event.
            showRemovePaymentMethodButton:true,
            showStoredPaymentMethods:true,
            async onDisableStoredPaymentMethod(storedPaymentMethodId, resolve, reject)
            {
                try{
                        const removeResponse=await callServer("/api/remove",storedPaymentMethodId);
                        console.log(removeResponse);
                        resolve(alert("Payment method successfully removed!!"));
                }
                catch(error)
                {
                    console.error(error);
                    reject(alert("Error occurred. Look at console for details"));
                }
            }
        }).mount("#component");  // pass DIV id where component must be rendered

	} catch (error) {
		console.error(error);
		alert("Error occurred. Look at console for details");
	}
}

// Some payment methods use redirects. This is where we finalize the operation
async function finalizeCheckout() {
    try {
        // Submit the extracted redirectResult (to trigger onPaymentCompleted(result, component) handler)
        //checkout.submitDetails({details: {redirectResult}});
        // Submit redirect result to /payments/details
        const data = {"redirectResult":redirectResult}
        callServer("/api/payments-details",data)
            .then(response => {
            // Your function to show the final result to the shopper
            showFinalResult(response);
            })
            .catch(error => {
              throw Error(error);
            });
    } catch (error) {
        console.error(error);
        alert("Error occurred. Look at console for details");
    }
}

async function createAdyenCheckout(paymentMethodsResponse) {

    const configuration = {
        clientKey,
        locale: "en_US",
        environment: "test",  // change to live for production
        showPayButton: true,
        paymentMethodsResponse: paymentMethodsResponse,
        onSubmit: (state, dropin) => {
            // Global configuration for onSubmit
            // Your function calling your server to make the `/payments` request
            //Add user currency and country selection
            state.data.currency=currency;
            state.data.country=country;
            state.data.nonCardStorePayment=nonCardStorePayment;
            state.data.recurringProcessingModel=recurringProcessingModel;
            callServer("/api/payments",state.data)
              .then(response => {
                if (response.action) {
                  // Drop-in handles the action object from the /payments response
                  dropin.handleAction(response.action);
                } else {
                  // Your function to show the final result to the shopper
                  showFinalResult(response);
                }
              })
              .catch(error => {
                throw Error(error);
              });
          },
        onAdditionalDetails: (state, dropin) => {
          // Your function calling your server to make a `/payments/details` request
          callServer("/api/payments-details",state.data)
            .then(response => {
              if (response.action) {
                // Drop-in handles the action object from the /payments response
                dropin.handleAction(response.action);
              } else {
                // Your function to show the final result to the shopper
                showFinalResult(response);
              }
            })
            .catch(error => {
              throw Error(error);
            });
        },
        paymentMethodsConfiguration: {
            ideal: {
                showImage: true
            },
            card: {
                enableStoreDetails:true,
                hasHolderName: true,
                holderNameRequired: true,
                name: "Credit or debit card",
                amount: {
                    value: 1000,
                    currency: currency
                }
            },
            paypal: {
                amount: {
                    currency: currency,
                    value: 1000
                },
                environment: "test",
                countryCode: country   // Only needed for test. This will be automatically retrieved when you are in production.
            }
        }
    };

    return new AdyenCheckout(configuration);
}


// Calls your server endpoints
async function callServer(url, data) {
    //console.log(data);
	const res = await fetch(url, {
		method: "POST",
		body: data ? JSON.stringify(data) : "",
		headers: {
			"Content-Type": "application/json"
		}
	});

	return await res.json();
}

// Handles responses sent from your server to the client
function showFinalResult(response) {
	
    switch (response.resultCode) {
        case "Authorised":
            window.location.href = "/result/success";
            break;
        case "Pending":
        case "Received":
            window.location.href = "/result/pending";
            break;
        case "Refused":
            window.location.href = "/result/failed";
            break;
        default:
            window.location.href = "/result/error";
            break;
    }
	
}


if (!redirectResult) {
    startCheckout();
}
else {
    // existing session: complete Checkout
    finalizeCheckout();
}

