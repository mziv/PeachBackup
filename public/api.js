/* TODO: This is a silly hack. Look into setting up your own cors proxy. */
let API_URL = "https://cors-anywho.herokuapp.com/https://v1.peachapi.com";

/* Make an API request.
   - method is the HTTP method
   - path is the path to the resource (must start with a /)
   - body is the request body. Assume that it will only supplied if the method isn't GET.
   Returns a pair (array with two elements) [status, data]:
   - status is the HTTP status (number)
   - data is the data from the server (assumed to be JSON)
   If the request fails or is not in JSON format, alert() the Error's message and then rethrow it. No exception should
   be generated for a non-OK HTTP status, as the client may wish to handle this case themselves. */
const apiRequest = async (method, path, auth = null, body = null) => {
  if (body !== null) body = JSON.stringify(body);
  let headers = { 'Content-Type' : 'application/json' }
  if (auth !== null) headers["Authorization"] = "Bearer " + auth;

  let response = await fetch(API_URL + path, {
    method: method,
    headers: headers,
    body: body
  });

  let json = await response.json();
  return [response.status, json];
};

/* This line exposes the apiRequest function in the console, so you can call it for testing */
window.apiRequest = apiRequest;

export default apiRequest;