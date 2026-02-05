import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

const app = new Hono()

// CORS 활성화
app.use('/api/*', cors())

// 정적 파일 제공
app.use('/static/*', serveStatic({ root: './public' }))
app.use('/data.json', serveStatic({ path: './public/data.json' }))

// 메인 페이지
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>경력수정 프로토타입</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            .step-indicator {
                counter-reset: step;
            }
            .step-item {
                position: relative;
                display: flex;
                flex-direction: column;
                align-items: center;
                flex: 1;
            }
            .step-item:not(:last-child)::after {
                content: '';
                position: absolute;
                width: 100%;
                height: 3px;
                background: #e5e7eb;
                top: 20px;
                left: 50%;
                z-index: -1;
            }
            .step-item.active .step-circle {
                background: #3b82f6;
                color: white;
            }
            .step-item.completed .step-circle {
                background: #10b981;
                color: white;
            }
            .step-item.completed::after {
                background: #10b981;
            }
            .step-circle {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                z-index: 1;
            }
            .career-card {
                transition: all 0.3s;
            }
            .career-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            }
            .career-card.selected {
                border-color: #3b82f6;
                background-color: #eff6ff;
            }
            .field-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1rem;
            }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <div class="container mx-auto px-4 py-8 max-w-7xl">
            <!-- 헤더 -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 class="text-3xl font-bold text-gray-800 mb-4">
                    <i class="fas fa-edit mr-2 text-blue-600"></i>
                    경력수정 (프로토타입)
                </h1>
                
                <!-- 단계 표시기 -->
                <div class="step-indicator flex justify-between items-start mt-6">
                    <div class="step-item" id="step-indicator-1">
                        <div class="step-circle">1</div>
                        <span class="text-sm mt-2 text-center">수정항목 선택</span>
                    </div>
                    <div class="step-item" id="step-indicator-2">
                        <div class="step-circle">2</div>
                        <span class="text-sm mt-2 text-center">경력 선택</span>
                    </div>
                    <div class="step-item" id="step-indicator-3">
                        <div class="step-circle">3</div>
                        <span class="text-sm mt-2 text-center">수정사항 입력</span>
                    </div>
                    <div class="step-item" id="step-indicator-4">
                        <div class="step-circle">4</div>
                        <span class="text-sm mt-2 text-center">서류 업로드</span>
                    </div>
                    <div class="step-item" id="step-indicator-5">
                        <div class="step-circle">5</div>
                        <span class="text-sm mt-2 text-center">제출</span>
                    </div>
                </div>
            </div>

            <!-- 컨텐츠 영역 -->
            <div class="bg-white rounded-lg shadow-md p-6">
                <div id="app-content">
                    <!-- 동적 컨텐츠가 여기에 로드됩니다 -->
                </div>

                <!-- 버튼 영역 -->
                <div class="flex justify-between mt-8 pt-6 border-t">
                    <button id="btn-prev" class="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition hidden">
                        <i class="fas fa-arrow-left mr-2"></i>이전
                    </button>
                    <div class="flex-1"></div>
                    <button id="btn-next" class="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                        다음<i class="fas fa-arrow-right ml-2"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- 모달 -->
        <div id="modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                <div id="modal-content"></div>
                <button id="modal-close" class="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    확인
                </button>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
