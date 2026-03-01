package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type TestRequest struct {
	Method  string            `json:"method"`
	URL     string            `json:"url"`
	Headers map[string]string `json:"headers"`
	Body    string            `json:"body"`
}

type TestResponse struct {
	Data struct {
		Status  int         `json:"status"`
		Body    interface{} `json:"body"`
		Time    int64       `json:"time"`
		Size    int         `json:"size"`
	} `json:"data"`
	Success bool   `json:"success"`
	Message string `json:"message"`
}

func main() {
	// Test the backend API
	testURL := "http://localhost:8080/api/v1/requests/send"
	
	requestData := TestRequest{
		Method: "GET",
		URL:    "https://httpbin.org/get",
		Headers: map[string]string{
			"User-Agent": "Rocket-API-Test",
		},
		Body: "",
	}

	jsonData, err := json.Marshal(requestData)
	if err != nil {
		fmt.Printf("Error marshaling request: %v\n", err)
		return
	}

	fmt.Println("🚀 Testing Rocket API backend...")
	fmt.Printf("📡 Sending request to: %s\n", testURL)
	fmt.Printf("📝 Request data: %s\n", string(jsonData))

	client := &http.Client{Timeout: 10 * time.Second}
	
	req, err := http.NewRequest("POST", testURL, bytes.NewBuffer(jsonData))
	if err != nil {
		fmt.Printf("Error creating request: %v\n", err)
		return
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Error sending request: %v\n", err)
		fmt.Println("💡 Make sure the backend server is running on port 8080")
		return
	}
	defer resp.Body.Close()

	fmt.Printf("✅ Got response: %d %s\n", resp.StatusCode, resp.Status)

	var response TestResponse
	if err := json.NewDecoder(resp.Body).Decode(&response); err != nil {
		fmt.Printf("Error decoding response: %v\n", err)
		return
	}

	fmt.Printf("📊 Response Status: %d\n", response.Data.Status)
	fmt.Printf("⏱️  Response Time: %d ms\n", response.Data.Time)
	fmt.Printf("💾 Response Size: %d bytes\n", response.Data.Size)
	fmt.Printf("💬 Message: %s\n", response.Message)
	
	if response.Success {
		fmt.Println("🎉 Test successful!")
	} else {
		fmt.Println("⚠️  Test completed but with issues")
	}
}