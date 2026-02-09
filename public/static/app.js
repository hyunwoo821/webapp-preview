// 전역 상태 관리
const state = {
    currentStep: 0,
    data: null,
    selectedEngineer: null, //기술인 선택
    selectedItems: [], // 선택된 항목코드들
    selectedCareer: null, // 선택된 경력 (표3 데이터)
    modifiedFields: {}, // 수정된 필드들
    matchedRule: null, // 매칭된 규칙 (표2 데이터)
    needsExtraDoc: false, // C1203 추가 서류 필요 여부
    uploadedFiles: {}, // 업로드된 파일들
    submissionData: null // 제출 데이터
};

// 초기화
async function init() {
    try {
        const response = await axios.get('/data.json');
        state.data = response.data;
        console.log('데이터 로드 완료:', state.data);
        renderStep(0);
        setupEventListeners();
    } catch (error) {
        console.error('데이터 로드 실패:', error);
        showModal('<p class="text-red-600">데이터를 로드하는데 실패했습니다.</p>');
    }
}

// 이벤트 리스너 설정
function setupEventListeners() {
    document.getElementById('btn-next').addEventListener('click', handleNext);
    document.getElementById('btn-prev').addEventListener('click', handlePrev);
    document.getElementById('modal-close').addEventListener('click', closeModal);
}

// 다음 버튼 핸들러
function handleNext() {
    if (state.currentStep === 0) {
        // Step0 검증: 항목이 선택되었는지
        if (!state.selectedEngineer) {
            showModal('<p class="text-red-600">기술인을 선택해주세요.</p>');
            return;
        }
    }
    if (state.currentStep === 1) {
        // Step1 검증: 항목이 선택되었는지
        const checkboxes = document.querySelectorAll('input[name="item-select"]:checked');
        if (checkboxes.length === 0) {
            showModal('<p class="text-red-600">최소 1개 이상의 수정항목을 선택해주세요.</p>');
            return;
        }
        state.selectedItems = Array.from(checkboxes).map(cb => cb.value);
        console.log('선택된 항목:', state.selectedItems);
    } else if (state.currentStep === 2) {
        // Step2 검증: 경력이 선택되었는지
        if (!state.selectedCareer) {
            showModal('<p class="text-red-600">수정할 경력을 선택해주세요.</p>');
            return;
        }
    } else if (state.currentStep === 3) {
        
        // Step3 검증: 수정사항이 입력되었는지
        const hasModifications = Object.keys(state.modifiedFields).length > 0;
        if (!hasModifications) {
            showModal('<p class="text-red-600">최소 1개 이상의 항목을 수정해주세요.</p>');
            return;
        }
        // 규칙 분석 실행
        analyzeRules();
    } else if (state.currentStep === 4) {
        // Step4: 서류 업로드 검증 (현재는 스킵 가능)
        // 제출 데이터 준비
        prepareSubmissionData();
    }

    // 다음 단계로 이동
    if (state.currentStep < 5) {
        state.currentStep++;
        renderStep(state.currentStep);
    }
}

// 이전 버튼 핸들러
function handlePrev() {
    if (state.currentStep > 1) {
        state.currentStep--;
        renderStep(state.currentStep);
    }
}

// 단계별 렌더링
function renderStep(step) {
    const content = document.getElementById('app-content');
    const prevBtn = document.getElementById('btn-prev');
    const nextBtn = document.getElementById('btn-next');

    // 단계 표시기 업데이트
    for (let i = 1; i <= 5; i++) {
        const indicator = document.getElementById(`step-indicator-${i}`);
        indicator.classList.remove('active', 'completed');
        if (i === step) {
            indicator.classList.add('active');
        } else if (i < step) {
            indicator.classList.add('completed');
        }
    }

    // 버튼 표시/숨김
    prevBtn.classList.toggle('hidden', step === 1);
    
    if (step === 5) {
        nextBtn.innerHTML = '<i class="fas fa-check mr-2"></i>제출';
    } else {
        nextBtn.innerHTML = '다음<i class="fas fa-arrow-right ml-2"></i>';
    }

    // 단계별 컨텐츠 렌더링
    switch (step) {
        case 0:
            renderStep0(content);
            break;
        case 1:
            renderStep1(content);
            break;
        case 2:
            renderStep2(content);
            break;
        case 3:
            renderStep3(content);
            break;
        case 4:
            renderStep4(content);
            break;
        case 5:
            renderStep5(content);
            break;
    }
}
// Step0 : 기술인 선택
function renderStep0(content) {
    const engineer = state.data.engineers;
    const isSelected = state.selectedEngineer?.engineerId === engineer.engineerId;

     const engineers = state.data.engineers;

    let html = `
        <h2 class="text-2xl font-bold mb-4">기술인 선택</h2>
        <div class="space-y-4 max-w-md">
    `;

    engineers.forEach(engineer => {
        const isSelected = state.selectedEngineer?.engineerId === engineer.engineerId;
        html += `
            <div class="career-card border-2 rounded-lg p-4 cursor-pointer
                ${isSelected ? 'selected border-blue-600' : 'border-gray-200'}"
                onclick="selectEngineer('${engineer.engineerId}')">
                <div class="font-bold">${engineer.name}</div>
                <div class="text-sm text-gray-500">ID: ${engineer.engineerId}</div>
            </div>
        `;
    });

    html += `</div>`;
    content.innerHTML = html;
}

//기술인 선택 함수
function selectEngineer(engineerId) {
    state.selectedEngineer = state.data.engineers.find(
        e => e.engineerId === engineerId
    );
    renderStep(0);
}



// Step1: 수정항목 선택
function renderStep1(content) {
    const items = state.data.table1;
    
    let html = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
            <i class="fas fa-list-check mr-2 text-blue-600"></i>
            수정할 항목을 선택하세요
        </h2>
        <p class="text-gray-600 mb-6">변경하고자 하는 항목을 체크박스로 선택해주세요. (복수 선택 가능)</p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    `;

    items.forEach(item => {
        const isChecked = state.selectedItems.includes(item.항목코드);
        html += `
            <label class="career-card border-2 rounded-lg p-4 cursor-pointer hover:shadow-md ${isChecked ? 'selected' : 'border-gray-200'}">
                <div class="flex items-center">
                    <input type="checkbox" name="item-select" value="${item.항목코드}" 
                        class="w-5 h-5 text-blue-600 mr-3" ${isChecked ? 'checked' : ''}>
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800">${item.항목명}</div>
                        <div class="text-sm text-gray-500">${item.항목코드}</div>
                    </div>
                </div>
            </label>
        `;
    });

    html += `</div>`;
    content.innerHTML = html;

    // 체크박스 이벤트 리스너
    document.querySelectorAll('input[name="item-select"]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const label = e.target.closest('label');
            if (e.target.checked) {
                label.classList.add('selected');
            } else {
                label.classList.remove('selected');
            }
        });
    });
}

// Step2: 수정 경력 선택
function renderStep2(content) {
    const careers = state.data.table3.filter(
        c => c.engineerId === state.selectedEngineer.engineerId
    );
    state.filteredCareers = careers;
    const selectedItemNames = state.selectedItems.map(code => {
        const item = state.data.table1.find(i => i.항목코드 === code);
        return item ? item.항목명 : code;
    }).join(', ');

    let html = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
            <i class="fas fa-briefcase mr-2 text-blue-600"></i>
            수정할 경력을 선택하세요
        </h2>
        <p class="text-gray-600 mb-2">선택한 수정항목: <strong class="text-blue-600">${selectedItemNames}</strong></p>
        <p class="text-gray-500 mb-6 text-sm">기존에 신고된 경력 중 하나를 선택해주세요.</p>
        
        <div class="space-y-4">
    `;

    careers.forEach((career, index) => {
        // index 기반으로 선택 여부 판단 (케이스ID 제거됨)
        const isSelected = state.selectedCareer && state.selectedCareer._index === index;
        
        // 모든 필드를 4줄로 표시
        const fields = Object.entries(career);
        const fieldsPerRow = Math.ceil(fields.length / 4);
        
        let rows = [];
        for (let i = 0; i < 4; i++) {
            const rowFields = fields.slice(i * fieldsPerRow, (i + 1) * fieldsPerRow);
            if (rowFields.length > 0) {
                rows.push(rowFields);
            }
        }

        html += `
            <div class="career-card border-2 rounded-lg p-4 cursor-pointer ${isSelected ? 'selected' : 'border-gray-200'}" 
                onclick="selectCareer(${index})">
                <div class="flex items-start mb-3">
                    <div class="w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-1 
                        ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}">
                        ${isSelected ? '<i class="fas fa-check text-white text-xs"></i>' : ''}
                    </div>
                    <div class="flex-1">
                        <h3 class="font-bold text-lg text-gray-800 mb-2">경력 #${index + 1}</h3>
        `;

        rows.forEach(row => {
            html += `<div class="grid grid-cols-2 md:grid-cols-${Math.min(row.length, 3)} gap-2 mb-2 text-sm">`;
            row.forEach(([key, value]) => {
                const displayValue = value || '-';
                html += `
                    <div>
                        <span class="text-gray-500">${key}:</span>
                        <span class="text-gray-800 font-medium ml-1">${displayValue}</span>
                    </div>
                `;
            });
            html += `</div>`;
        });

        html += `
                    </div>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    content.innerHTML = html;
}

// 경력 선택 함수
function selectCareer(index) {
    const career = state.filteredCareers[index];
    state.selectedCareer = {
        ...career,
        _index: index
    };
    console.log('선택된 경력:', state.selectedCareer);
    renderStep(2); // 화면 다시 그리기
}

// Step3: 수정사항 입력
function renderStep3(content) {
    const career = state.selectedCareer;
    const selectedItemCodes = state.selectedItems;
    
    // 선택된 항목에 해당하는 필드명 찾기
    const editableFields = selectedItemCodes.map(code => {
        const item = state.data.table1.find(i => i.항목코드 === code);
        return item ? item.항목명 : code;
    });
    
    // 필드명 매칭을 위한 키워드 추출 함수
    function getFieldKeywords(itemName) {
        const keywords = [];
        // "직무·전문분야" -> ["직무", "전문"]
        if (itemName.includes('·')) {
            const parts = itemName.split('·');
            parts.forEach(part => {
                // "(수정)", "(취소)" 등 제거
                const cleaned = part.replace(/\(.*?\)/g, '').trim();
                if (cleaned) keywords.push(cleaned);
            });
        } else {
            // 단일 필드명에서 괄호 제거
            const cleaned = itemName.replace(/\(.*?\)/g, '').trim();
            if (cleaned) keywords.push(cleaned);
        }
        return keywords;
    }
    
    // 선택된 항목의 모든 키워드 수집
    const allKeywords = [];
    editableFields.forEach(field => {
        allKeywords.push(...getFieldKeywords(field));
    });

    let html = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
            <i class="fas fa-pen-to-square mr-2 text-blue-600"></i>
            수정할 내용을 입력하세요
        </h2>
        <p class="text-gray-600 mb-6">좌측에는 기존 정보가, 우측에는 수정 가능한 항목이 표시됩니다.</p>
        
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- 좌측: 기존 정보 -->
            <div class="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 class="font-bold text-lg mb-4 text-gray-700">
                    <i class="fas fa-file-lines mr-2"></i>기존 신고 내용
                </h3>
                <div class="space-y-3">
    `;

    Object.entries(career).forEach(([key, value]) => {
        // _index는 내부 식별자이므로 제외
        if (key === '_index') {
            return;
        }
        
        const displayValue = value || '-';
        html += `
            <div class="flex border-b border-gray-200 pb-2">
                <div class="w-1/3 text-gray-600 text-sm font-medium">${key}</div>
                <div class="w-2/3 text-gray-800">${displayValue}</div>
            </div>
        `;
    });

    html += `
                </div>
            </div>

            <!-- 우측: 수정 입력 -->
            <div class="bg-blue-50 rounded-lg p-6 border border-blue-200">
                <h3 class="font-bold text-lg mb-4 text-gray-700">
                    <i class="fas fa-edit mr-2 text-blue-600"></i>수정할 항목
                </h3>
                <form id="edit-form" class="space-y-4">
    `;

    Object.entries(career).forEach(([key, value]) => {
        // _index는 내부 식별자이므로 제외
        if (key === '_index') {
            return;
        }
        
        // 필드가 편집 가능한지 확인 (키워드 기반 매칭)
        const isEditable = allKeywords.some(keyword => {
            // 필드명에 키워드가 포함되어 있는지 확인
            return key.includes(keyword);
        });
        
        // 수정 항목은 빈값으로 시작, 비수정 항목은 기존 값 표시
        const currentValue = state.modifiedFields[key] !== undefined 
            ? state.modifiedFields[key] 
            : (isEditable ? '' : (value || ''));
        
        html += `
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">${key}</label>
                <input type="text" 
                    name="${key}" 
                    value="${currentValue}"
                    class="w-full px-3 py-2 border rounded-lg ${isEditable ? 'bg-white border-blue-300 focus:ring-2 focus:ring-blue-500' : 'bg-gray-100 border-gray-300 cursor-not-allowed'}"
                    ${isEditable ? '' : 'readonly'}
                    placeholder="${isEditable ? '수정할 내용을 입력하세요' : '수정 불가'}">
            </div>
        `;
    });

    html += `
                </form>
                <button onclick="saveModifications()" class="mt-6 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                    <i class="fas fa-save mr-2"></i>수정 내용 저장
                </button>
            </div>
        </div>
    `;

    content.innerHTML = html;
}

// 수정 내용 저장
function saveModifications() {
    const form = document.getElementById('edit-form');
    const formData = new FormData(form);
    
    state.modifiedFields = {};
    let hasChanges = false;

    for (let [key, value] of formData.entries()) {
        // _index는 제외
        if (key === '_index') continue;
        
        const originalValue = state.selectedCareer[key] || '';
        // 빈 값이 아니고, 원래 값과 다르면 수정된 것으로 간주
        if (value && value.trim() !== '' && value !== originalValue) {
            state.modifiedFields[key] = value;
            hasChanges = true;
        }
    }

    if (!hasChanges) {
        showModal('<p class="text-yellow-600">변경된 항목이 없습니다. 수정할 내용을 입력해주세요.</p>');
        return;
    }

    console.log('수정된 필드:', state.modifiedFields);
    showModal('<p class="text-green-600"><i class="fas fa-check-circle mr-2"></i>수정 내용이 저장되었습니다!</p>');
}

// Step3에서 규칙 분석
function analyzeRules() {
    const rules = state.data.table2;
    const career = state.selectedCareer;
    const modifications = state.modifiedFields;

    console.log('규칙 분석 시작:', { career, modifications });

    // 선택된 항목코드와 일치하는 규칙 찾기
    let matchedRule = null;
    let highestPriority = -1;
    let needsExtraDoc = false;

    // 각 항목코드에 대해 매칭되는 규칙 찾기
    for (let itemCode of state.selectedItems) {
        // 해당 항목코드의 규칙들 필터링
        const candidateRules = rules.filter(rule => rule.항목코드 === itemCode);
        
        if (candidateRules.length === 0) continue;
        
        // 여러 규칙이 있으면 조건 평가
        for (let rule of candidateRules) {
            const conditionResult = evaluateCondition(rule, career, modifications);
            
            console.log(`규칙 ${rule.케이스ID} 평가:`, conditionResult);
            
            if (conditionResult.matched && conditionResult.priority > highestPriority) {
                matchedRule = rule;
                highestPriority = conditionResult.priority;
                needsExtraDoc = conditionResult.needsExtraDoc || false;
            }
        }
    }

    // 매칭된 규칙이 없으면 첫 번째 규칙 사용
    if (!matchedRule && state.selectedItems.length > 0) {
        matchedRule = rules.find(rule => state.selectedItems.includes(rule.항목코드));
    }

    state.matchedRule = matchedRule;
    state.needsExtraDoc = needsExtraDoc;
    console.log('최종 매칭된 규칙:', matchedRule);
    console.log('추가 서류 필요:', needsExtraDoc);
}

// 조건 평가 함수
function evaluateCondition(rule, career, modifications) {
    const condition = rule.조건;
    
    // 조건이 없으면 기본 매칭
    if (!condition) {
        return { matched: true, priority: 0 };
    }

    // 비교값들 추출
    const 비교값1 = rule.비교값1; // 예: "직무분야"
    const 비교값2 = rule.비교값2; // 예: "수정 직무분야"
    const 비교값3 = rule.비교값3; // 예: "전문분야"
    const 비교값4 = rule.비교값4; // 예: "수정 전문분야"

    // 실제 값 가져오기
    const 기존_직무분야 = career['직무분야'] || '';
    const 수정_직무분야 = modifications['직무분야'] || '';
    const 기존_전문분야 = career['전문분야'] || '';
    const 수정_전문분야 = modifications['전문분야'] || '';
    const 기존_담당업무 = career['담당업무'] || '';
    const 수정_담당업무 = modifications['담당업무'] || '';
    const 기존_참여사업명 = career['참여사업명'] || '';
    const 수정_참여사업명 = modifications['참여사업명'] || '';
    const 기존_발주자 = career['발주자'] || '';
    const 수정_발주자 = modifications['발주자'] || '';
    const 보유건설업 = career['보유건설업'] || '';
    const 책임정도 = career['책임정도'] || '';
    const 종료신고일 = career['종료신고일'] || '';
    const 근무처명 = career['근무처명'] || '';
    const 발주청소속 = career['발주청소속'] || '';

    console.log('조건 평가 데이터:', {
        기존_직무분야, 수정_직무분야,
        기존_전문분야, 수정_전문분야,
        조건: condition
    });
    
    // C0801: (참여사업명에 본사가 포함) and (수정 참여사업명에 본사가 미포함)
    if (rule.케이스ID === 'C0801') {
        const 참여사업조건 =
            includesText(기존_참여사업명, '본사') &&
            !includesText(수정_참여사업명, '본사');
        
        const 담당업무_수정안함 = modifications['담당업무'] === undefined;
        const 담당업무_동일 =
            modifications['담당업무'] !== undefined &&
            기존_담당업무 === 수정_담당업무;
        if (참여사업조건 && (담당업무_수정안함 || 담당업무_동일)) {
            return { matched: true, priority: 10 };
        }
    }

    // C0802: (발주청 소속 기술인) and (참여사업명에 본사가 포함) and (수정 참여사업명에 본사가 미포함)
    if (rule.케이스ID === 'C0802') {
        const 참여사업조건 =
            수정_참여사업명 &&
            includesText(기존_참여사업명, '본사') &&
            !includesText(수정_참여사업명, '본사');

        const 발주청조건 = 발주청소속 === 'O';

        // 담당업무 조건 (C0801과 동일)
        const 담당업무_수정안함 = modifications['담당업무'] === undefined;
        const 담당업무_동일 =
            modifications['담당업무'] !== undefined &&
            기존_담당업무 === 수정_담당업무;

        if (참여사업조건 && 발주청조건 && (담당업무_수정안함 || 담당업무_동일)) {
            return { matched: true, priority: 12 };
        }
    }

    // C0803: (수정 담당업무가 시공) and (참여사업명에 본사가 포함) and (수정 참여사업명에 본사가 미포함)
    if (rule.케이스ID === 'C0803') {
        const 참여사업명_다름 = 수정_참여사업명 && 기존_참여사업명 !== 수정_참여사업명;
        const 참여사업1 = ['본사'].includes(기존_참여사업명);
        const 참여사업2 = !['본사'].includes(수정_참여사업명);
        const 담당업무1 = 수정_담당업무 === '시공'

        if (참여사업명_다름 && 참여사업1 && 참여사업2 && 담당업무1) {
            return { matched: true, priority: 12 };
        }
    }

    // C0804: (수정 담당업무가 시공) and (참여사업명에 본사가 포함) and (수정 참여사업명에 본사가 미포함) and (책임정도가 현장대리인 또는 품질관리자 또는 안전관리자)
    if (rule.케이스ID === 'C0804') {
        const 참여사업명_다름 = 수정_참여사업명 && 기존_참여사업명 !== 수정_참여사업명;
        const 참여사업1 = ['본사'].includes(기존_참여사업명);
        const 참여사업2 = !['본사'].includes(수정_참여사업명);
        const 담당업무1 = 수정_담당업무 === '시공'
        const 책임정도1 = ['현장대리인', '품질관리자', '안전관리자'].includes(책임정도)

        if (참여사업명_다름 && 참여사업1 && 참여사업2 && 담당업무1 && 책임정도1) {
            return { matched: true, priority: 15 };
        }
    }

    // C0805: (참여사업명과 수정 참여사업명이 다른 경우)
    if (rule.케이스ID === 'C0805') {
        const 참여사업명_다름 = 수정_참여사업명 && 기존_참여사업명 !== 수정_참여사업명;
        
        if (참여사업명_다름) {
            return { matched: true, priority: 5 };
        }
    }
    
    // C0806: (참여사업명에 본사가 포함) and (수정 참여사업명에 본사가 포함) (예외케이스)
    if (rule.케이스ID === 'C0806') {
        const 참여사업조건 =
            수정_참여사업명 &&
            includesText(기존_참여사업명, '본사') &&
            includesText(수정_참여사업명, '본사');

        if (참여사업조건) {
            return { matched: true, priority: 7 };
        }
    }
    // C0901: 기관 통합 또는 상호변경 등으로 변경이 확인되는 경우
    if (rule.케이스ID === 'C0901') {
        const 발주자조건 = 기존_발주자 === '서울지하철공사' && 
                        수정_발주자 === '서울메트로'

        if (발주자조건) {
            return { matched: true, priority: 10 };
        }
    }
    // C0902: 공사계약서 또는 실적증명서로 발주자명을 변경하는 경우
    if (rule.케이스ID === 'C0902') {
        const 발주자_다름 = 수정_발주자 && 기존_발주자 !== 수정_발주자;
        
        if (발주자_다름) {
            return { matched: true, priority: 7 };
        }
    }
    // C1201: 국토개발→조경/토목/도시교통 또는 자연토양→자연환경/토양환경
    if (rule.케이스ID === 'C1201') {
        const cond1 = 기존_직무분야 === '국토개발' && 
                    ['조경', '토목', '도시·교통'].includes(수정_직무분야);
        const cond2 = 기존_전문분야 === '자연·토양' && 
                    ['자연환경', '토양환경'].includes(수정_전문분야);
        if (cond1 || cond2) {
            return { matched: true, priority: 10 };
        }
    }

    // C1202: 직무분야가 다르거나 전문분야가 다른 경우 (일반적인 변경) - 심의
    if (rule.케이스ID === 'C1202') {
        const 직무분야_다름 = 수정_직무분야 && 기존_직무분야 !== 수정_직무분야;
        const 전문분야_다름 = 수정_전문분야 && 기존_전문분야 !== 수정_전문분야;
        const 환경토양 = 수정_직무분야 === '환경' && 수정_전문분야 === '토양환경';
        
        if (직무분야_다름 || 전문분야_다름 || 환경토양) {
            return { matched: true, priority: 5 };
        }
    }

    // C1203: 건축/건축기계설비 ↔ 기계/공조냉동및설비
    if (rule.케이스ID === 'C1203') {
        const cond1 = 기존_직무분야 === '건축' && 기존_전문분야 === '건축기계설비' &&
                    수정_직무분야 === '기계' && 수정_전문분야 === '공조냉동및설비';
        const cond2 = 기존_직무분야 === '기계' && 기존_전문분야 === '공조냉동및설비' &&
                    수정_직무분야 === '건축' && 수정_전문분야 === '건축기계설비';
        if (cond1 || cond2) {
            // 종료신고일이 2014.05.22 이전이면 추가 서류 필요
            const needsExtraDoc = 종료신고일 && 종료신고일 < '2014.05.22';
            return { matched: true, priority: 15, needsExtraDoc: needsExtraDoc };
        }
    }

    // C1204: 보유건설업에 해당하는 직무분야로 수정
    if (rule.케이스ID === 'C1204') {
        if (보유건설업 === '건축공사업' && 수정_직무분야 === '건축') {
            // 건축공사업 → 건축 직무분야 매칭
            return { matched: true, priority: 8 };
        } else if (보유건설업 === '토목공사업' && 수정_직무분야 === '토목') {
            // 토목공사업 → 토목 직무분야 매칭
            return { matched: true, priority: 8 };
        }
    }

    // C1205: 품질/안전관리자 → 품질관리 전문분야
    if (rule.케이스ID === 'C1205') {
        const is품질안전관리자 = ['품질관리자', '안전관리자'].includes(책임정도);
        const 기존_not품질관리 = !['토목품질관리', '건축품질관리'].includes(기존_전문분야);
        const 수정_품질관리 = ['토목품질관리', '건축품질관리'].includes(수정_전문분야);
        
        if (is품질안전관리자 && 기존_not품질관리 && 수정_품질관리) {
            return { matched: true, priority: 12 };
        }
    }

    // C1206: 시험→품질관리, 전문분야→토목품질관리
    if (rule.케이스ID === 'C1206') {
        const cond = 기존_담당업무 === '시험' && 
                    기존_전문분야 !== '토목품질관리' &&
                    수정_담당업무 === '품질관리' && 
                    수정_전문분야 === '토목품질관리';
        if (cond) {
            return { matched: true, priority: 12 };
        }
    }

    // C1207: 건축구조→건축계획설계 (종료일 ≤ 2010.02.02)
    if (rule.케이스ID === 'C1207') {
        const cond1 = 기존_전문분야 === '건축구조' && 수정_전문분야 === '건축계획·설계';
        const cond2 = 종료신고일 && 종료신고일 <= '2010.02.02';
        if (cond1 && cond2) {
            return { matched: true, priority: 15 };
        }
    }

    // C1208: 건축구조→건축계획설계 (종료일 > 2010.02.02)
    if (rule.케이스ID === 'C1208') {
        const cond1 = 기존_전문분야 === '건축구조' && 수정_전문분야 === '건축계획·설계';
        const cond2 = 종료신고일 && 종료신고일 > '2010.02.02';
        if (cond1 && cond2) {
            return { matched: true, priority: 15 };
        }
    }

    // C1209: 측량및지형공간정보→지적 (한국국토정보공사)
    if (rule.케이스ID === 'C1209') {
        const cond = 기존_전문분야 === '측량및지형공간정보' && 
                    수정_전문분야 === '지적' &&
                    근무처명 && 근무처명.includes('한국국토정보공사');
        if (cond) {
            return { matched: true, priority: 15 };
        }
    }

    // C1210: 일반분야→시공분야 (보유건설업 있음)
    if (rule.케이스ID === 'C1210') {
        const 기존_not시공 = !['건축시공', '토목시공'].includes(기존_전문분야);
        const 수정_시공 = ['건축시공', '토목시공'].includes(수정_전문분야);
        const has보유건설업 = 보유건설업 && 보유건설업.trim() !== '';
        
        if (기존_not시공 && 수정_시공 && has보유건설업) {
            return { matched: true, priority: 12 };
        }
    }
 
    return { matched: false, priority: 0 };
}

// Step4: 서류 업로드
function renderStep4(content) {
    const rule = state.matchedRule;

    let html = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
            <i class="fas fa-upload mr-2 text-blue-600"></i>
            필수 서류를 업로드하세요
        </h2>
    `;

    if (!rule) {
        html += `
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p class="text-yellow-800"><i class="fas fa-exclamation-triangle mr-2"></i>매칭되는 규칙이 없습니다. 다음 단계로 진행합니다.</p>
            </div>
        `;
    } else {
        html += `
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 class="font-bold text-gray-800 mb-2">처리 유형</h3>
                <p class="text-blue-800 text-lg">${rule.처리유형결정}</p>
            </div>

            <h3 class="font-bold text-lg mb-4 text-gray-700">필수 서류 목록</h3>
            <div class="space-y-4">
        `;

        // 필수서류 필드들 찾기
        let docCount = 0;
        for (let i = 1; i <= 6; i++) {
            const docField = `필수서류${i}`;
            const docName = rule[docField];
            
            if (docName && docName.trim() !== '') {
                docCount++;
                const fileId = `file-${i}`;
                const uploadedFile = state.uploadedFiles[docName];

                html += `
                    <div class="border border-gray-300 rounded-lg p-4">
                        <label class="block font-medium text-gray-700 mb-2">
                            ${docCount}. ${docName}
                        </label>
                        <div class="flex items-center gap-3">
                            <input type="file" 
                                id="${fileId}" 
                                class="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                onchange="handleFileUpload('${docName}', '${fileId}')">
                            <button onclick="removeFile('${docName}', '${fileId}')" 
                                class="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 ${uploadedFile ? '' : 'hidden'}" 
                                id="${fileId}-remove">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                        <div id="${fileId}-name" class="mt-2 text-sm text-green-600 ${uploadedFile ? '' : 'hidden'}">
                            <i class="fas fa-check-circle mr-1"></i>${uploadedFile ? uploadedFile.name : ''}
                        </div>
                    </div>
                `;
            }
        }

        // C1203 추가 서류 (종료신고일이 2014.05.22 이전)
        if (state.needsExtraDoc) {
            docCount++;
            const extraDocName = '경력변경신고서 또는 경력증명서';
            const fileId = `file-extra`;
            const uploadedFile = state.uploadedFiles[extraDocName];

            html += `
                <div class="border border-orange-300 rounded-lg p-4 bg-orange-50">
                    <label class="block font-medium text-orange-700 mb-2">
                        ${docCount}. ${extraDocName}
                        <span class="text-sm text-orange-600 ml-2">(종료신고일이 2014.05.22 이전)</span>
                    </label>
                    <div class="flex items-center gap-3">
                        <input type="file" 
                            id="${fileId}" 
                            class="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                            onchange="handleFileUpload('${extraDocName}', '${fileId}')">
                        <button onclick="removeFile('${extraDocName}', '${fileId}')" 
                            class="px-3 py-2 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 ${uploadedFile ? '' : 'hidden'}" 
                            id="${fileId}-remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div id="${fileId}-name" class="mt-2 text-sm text-green-600 ${uploadedFile ? '' : 'hidden'}">
                        <i class="fas fa-check-circle mr-1"></i>${uploadedFile ? uploadedFile.name : ''}
                    </div>
                </div>
            `;
        }

        html += `
            </div>
            <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <p class="text-sm text-yellow-800">
                    <i class="fas fa-info-circle mr-2"></i>
                    프로토타입에서는 파일 업로드 없이도 다음 단계로 진행할 수 있습니다.
                </p>
            </div>
        `;
    }

    content.innerHTML = html;
}

// 파일 업로드 핸들러
function handleFileUpload(docName, fileId) {
    const input = document.getElementById(fileId);
    const file = input.files[0];
    
    if (file) {
        state.uploadedFiles[docName] = file;
        document.getElementById(`${fileId}-name`).textContent = file.name;
        document.getElementById(`${fileId}-name`).classList.remove('hidden');
        document.getElementById(`${fileId}-remove`).classList.remove('hidden');
        console.log('파일 업로드:', docName, file.name);
    }
}

// 파일 삭제 핸들러
function removeFile(docName, fileId) {
    delete state.uploadedFiles[docName];
    document.getElementById(fileId).value = '';
    document.getElementById(`${fileId}-name`).classList.add('hidden');
    document.getElementById(`${fileId}-remove`).classList.add('hidden');
    console.log('파일 삭제:', docName);
}

// 제출 데이터 준비
function prepareSubmissionData() {
    state.submissionData = {
        selectedItems: state.selectedItems,
        selectedCareer: state.selectedCareer,
        modifiedFields: state.modifiedFields,
        matchedRule: state.matchedRule,
        uploadedFiles: Object.keys(state.uploadedFiles).map(name => ({
            name: name,
            fileName: state.uploadedFiles[name].name
        })),
        timestamp: new Date().toISOString()
    };

    // 로컬 스토리지에 저장
    localStorage.setItem('careerModification', JSON.stringify(state.submissionData));
    console.log('제출 데이터 준비 완료:', state.submissionData);
}

// Step5: 요약 및 제출
function renderStep5(content) {
    const data = state.submissionData;

    let html = `
        <h2 class="text-2xl font-bold mb-4 text-gray-800">
            <i class="fas fa-clipboard-check mr-2 text-blue-600"></i>
            제출 내용 확인
        </h2>
        <p class="text-gray-600 mb-6">아래 내용을 확인하신 후 제출 버튼을 클릭해주세요.</p>
        
        <!-- 수정 항목 -->
        <div class="bg-white border border-gray-300 rounded-lg p-4 mb-4">
            <h3 class="font-bold text-lg mb-2 text-gray-700">선택한 수정 항목</h3>
            <div class="flex flex-wrap gap-2">
    `;

    data.selectedItems.forEach(code => {
        const item = state.data.table1.find(i => i.항목코드 === code);
        html += `
            <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                ${item ? item.항목명 : code}
            </span>
        `;
    });

    html += `
            </div>
        </div>

        <!-- 선택한 경력 -->
        <div class="bg-white border border-gray-300 rounded-lg p-4 mb-4">
            <h3 class="font-bold text-lg mb-2 text-gray-700">선택한 경력</h3>
            <div class="text-sm text-gray-600">
                근무처: <strong>${data.selectedCareer.근무처명 || '-'}</strong>, 
                입사일: <strong>${data.selectedCareer.입사일 || '-'}</strong>, 
                퇴사일: <strong>${data.selectedCareer.퇴사일 || '-'}</strong>
            </div>
        </div>

        <!-- 수정 내용 -->
        <div class="bg-white border border-gray-300 rounded-lg p-4 mb-4">
            <h3 class="font-bold text-lg mb-2 text-gray-700">수정 내용</h3>
            <div class="space-y-2">
    `;

    Object.entries(data.modifiedFields).forEach(([key, newValue]) => {
        const oldValue = data.selectedCareer[key] || '-';
        html += `
            <div class="flex items-start text-sm">
                <div class="w-1/3 text-gray-600 font-medium">${key}</div>
                <div class="w-1/3">
                    <span class="line-through text-red-500">${oldValue}</span>
                </div>
                <div class="w-1/3">
                    <span class="text-green-600 font-semibold">${newValue}</span>
                </div>
            </div>
        `;
    });

    html += `
            </div>
        </div>

        <!-- 처리 유형 및 필수 서류 -->
    `;

    if (data.matchedRule) {
        html += `
            <div class="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                <h3 class="font-bold text-lg mb-2 text-gray-700">처리 유형</h3>
                <p class="text-blue-800 font-semibold">${data.matchedRule.처리유형결정}</p>
            </div>

            <div class="bg-white border border-gray-300 rounded-lg p-4 mb-4">
                <h3 class="font-bold text-lg mb-2 text-gray-700">업로드한 서류</h3>
        `;

        if (data.uploadedFiles.length > 0) {
            html += `<ul class="space-y-1">`;
            data.uploadedFiles.forEach(file => {
                html += `
                    <li class="text-sm text-gray-700">
                        <i class="fas fa-file-alt mr-2 text-blue-600"></i>
                        ${file.name}: ${file.fileName}
                    </li>
                `;
            });
            html += `</ul>`;
        } else {
            html += `<p class="text-gray-500 text-sm">업로드된 파일이 없습니다.</p>`;
        }

        html += `</div>`;
    }

    html += `
        <div class="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <p class="text-sm text-green-800">
                <i class="fas fa-info-circle mr-2"></i>
                제출 버튼을 클릭하면 신청이 완료됩니다.
            </p>
        </div>
    `;

    content.innerHTML = html;

    // 제출 버튼 이벤트 변경
    const nextBtn = document.getElementById('btn-next');
    nextBtn.onclick = submitApplication;
}

// 제출 처리
function submitApplication() {
    console.log('제출 처리:', state.submissionData);
    
    showModal(`
        <div class="text-center">
            <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i class="fas fa-check text-3xl text-green-600"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">제출 완료 (프로토타입)</h3>
            <p class="text-gray-600">경력 수정 신청이 완료되었습니다.</p>
            <p class="text-sm text-gray-500 mt-2">데이터는 로컬 스토리지에 저장되었습니다.</p>
        </div>
    `);

    // 모달 닫기 후 초기화
    document.getElementById('modal-close').onclick = () => {
        closeModal();
        resetApplication();
    };
}

// 애플리케이션 초기화
function resetApplication() {
    state.currentStep = 1;
    state.selectedItems = [];
    state.selectedCareer = null;
    state.modifiedFields = {};
    state.matchedRule = null;
    state.needsExtraDoc = false;
    state.uploadedFiles = {};
    state.submissionData = null;
    
    renderStep(1);
    
    // 버튼 이벤트 복원
    document.getElementById('btn-next').onclick = handleNext;
}

// 공통 유틸 함수1 (문자 포함 여부)
function includesText(value, keyword) {
    if (!value || !keyword) return false;
    return value.includes(keyword);
}

// 모달 표시
function showModal(content) {
    document.getElementById('modal-content').innerHTML = content;
    document.getElementById('modal').classList.remove('hidden');
}

// 모달 닫기
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', init);
