# List tất cả namespaces để xem ID
npx wrangler kv namespace list

# Xoá worker hiện tại
npx wrangler delete polling-app

# Sau đó xoá bằng ID (thay NAMESPACE_ID bằng ID thực)
npx wrangler kv namespace delete --namespace-id NAMESPACE_ID

# f38172869f1944bab3ca71102826a328

npx wrangler kv namespace create "POLLS_KV"
npx wrangler kv namespace create "POLLS_KV" --preview

npx wrangler deploy

# Mở browser và truy cập
open https://polling-app.sycu-lee.workers.dev

# Test tạo poll
curl -X POST "https://polling-app.sycu-lee.workers.dev/api/create?pollId=test123" \
  -H "Content-Type: application/json" \
  -d '{
    "question": "What is your favorite color?",
    "options": ["Red", "Blue", "Green", "Yellow"]
  }'

# Test get poll
curl "https://polling-app.sycu-lee.workers.dev/api/get?pollId=test123"

# Test vote
curl -X POST "https://polling-app.sycu-lee.workers.dev/api/vote?pollId=test123" \
  -H "Content-Type: application/json" \
  -d '{"option": "Blue"}'