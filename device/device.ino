#include <WebSocketsClient.h>
#include <WiFi.h>
#include <stdlib.h>
#include <config.h>

const char *HOSTNAME = "cowboy-hat";

// {R, G, B}
const uint8_t GPIO_RGB[3] = {25, 26, 27};
const uint8_t GPIO_STATUS_LED = 2;

WebSocketsClient client;

void setup() {
  pinMode(GPIO_STATUS_LED, OUTPUT);
  
  connectToWifi();

  connectToWebSocket();
}

void connectToWebSocket() {
  client.beginSSL(WS_SERVER_HOST, WS_SERVER_PORT, "/?esp");
  client.onEvent(handleWebSocketEvent);
}

void connectToWifi() {
  WiFi.setHostname(HOSTNAME);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  bool lightOn = false;
  while (WiFi.status() != WL_CONNECTED) {
    digitalWrite(GPIO_STATUS_LED, (lightOn = !lightOn));
    delay(200);
  }
  digitalWrite(GPIO_STATUS_LED, LOW);
}

void handleWebSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
  if (type == WStype_CONNECTED) {
    digitalWrite(GPIO_STATUS_LED, HIGH);
  } else if (type == WStype_DISCONNECTED){
    digitalWrite(GPIO_STATUS_LED, LOW);
  } else if (type == WStype_TEXT) {
    handleMessage((const char *)payload);
  }
}

void handleMessage(const char *msg) {
  char message[12]; // max 11 characters + '\0'
  message[0] = '\0';
  strncat(message, msg, 11);
  char *token = strtok(message, ",");
  
  unsigned char i = 0;
  while (token != NULL) {
    analogWrite(GPIO_RGB[i++], atoi(token));
    token = strtok(NULL, ",");
  }
}

void loop() {
  client.loop();
}
