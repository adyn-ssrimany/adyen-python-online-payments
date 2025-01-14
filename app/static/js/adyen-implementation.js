const clientKey = JSON.parse(document.getElementById('client-key').innerHTML);
const type = JSON.parse(document.getElementById('integration-type').innerHTML);

const country = JSON.parse(document.getElementById('country').innerHTML);
const currency = JSON.parse(document.getElementById('currency').innerHTML);

const nonCardStorePayment = JSON.parse(document.getElementById('storePaymentMethod').innerHTML);
const recurringProcessingModel = JSON.parse(document.getElementById('recurringProcessingModel').innerHTML);


// Used to finalize a checkout call in case of redirect
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId'); // Unique identifier for the payment session
const redirectResult = urlParams.get('redirectResult');


// Start the Checkout workflow
async function startCheckout() {
	try {
	    // Init Sessions
        const data = {"country":country,"currency":currency,"nonCardStorePayment":nonCardStorePayment,"recurringProcessingModel":recurringProcessingModel}
		const checkoutSessionResponse = await callServer("/api/sessions?type=" + type,data);

        // Create AdyenCheckout using Sessions response
		const checkout = await createAdyenCheckout(checkoutSessionResponse);

		// Create an instance of Drop-in and mount it to the container you created.
		const dropinComponent = await checkout.create(type, {
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
        // Create AdyenCheckout re-using existing Session
        const checkout = await createAdyenCheckout({id: sessionId});

        // Submit the extracted redirectResult (to trigger onPaymentCompleted(result, component) handler)
        checkout.submitDetails({details: {redirectResult}});
    } catch (error) {
        console.error(error);
        alert("Error occurred. Look at console for details");
    }
}

async function createAdyenCheckout(session) {

    const configuration = {
        clientKey,
        locale: "en_GB",
        environment: "test",  // change to live for production
        showPayButton: true,
        session: session,
        paymentMethodsConfiguration: {
            ideal: {
                showImage: true
            },
            card: {
                useClickToPay: true,
                clickToPayConfiguration: {
                    merchantDisplayName: 'Cocoreo'
                },
                enableStoreDetails:true,
                positionHolderNameOnTop:true,
                hasHolderName: true,
                holderNameRequired: true,
                name: "Credit or debit card",
                amount: {
                    value: 1000,
                    currency: currency
                },
                installmentOptions: {
                    card: {
                            // Shows 1, 2, 3 and 6 as the numbers of monthly installments that the shopper can choose.
                            values: [1, 2, 3, 6],
                            // Shows regular and revolving as plans that the shopper can choose.
                            // plans: [ 'regular' ]
                            plans: [ 'regular']
                        },
                    // Shows payment amount per installment.
                    showInstallmentAmounts: true
                },
            },
            paypal: {
                amount: {
                    currency: currency,
                    value: 1000
                },
                environment: "test",
                countryCode: country   // Only needed for test. This will be automatically retrieved when you are in production.
            },
            googlepay:{
                buttonColor:"black",
                allowedPaymentMethods:[
                    {
                        type: "CARD",
                        parameters: {
                            allowedAuthMethods: ["CRYPTOGRAM_3DS"]
                        }
                    }
                ]
            },
        },
        onPaymentCompleted: (result, component) => {
            handleServerResponse(result, component);
        },
        onError: (error, component) => {
            console.error(error.name, error.message, error.stack, component);
        }
    };

    return new AdyenCheckout(configuration);
}


// Calls your server endpoints
async function callServer(url, data) {
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
function handleServerResponse(res, component) {
	if (res.action) {
		component.handleAction(res.action);
	} else {
		switch (res.resultCode) {
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
}

if (!redirectResult) {
    startCheckout();
}
else {
    // existing session: complete Checkout
    finalizeCheckout();
}