$body = @{ text = '（1）成绩单；（2）外语水平证明' } | ConvertTo-Json
Invoke-WebRequest -Method Post -Uri 'http://127.0.0.1:8000/parse' -ContentType 'application/json' -Body $body

