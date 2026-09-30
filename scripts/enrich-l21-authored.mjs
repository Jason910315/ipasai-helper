import { readFile, writeFile } from 'node:fs/promises'

const path = new URL('../content/questions/l21.json', import.meta.url)
const questions = JSON.parse(await readFile(path, 'utf8'))
const guideUrl = 'https://ipd.nat.gov.tw/ipas/certification/AIAP/learning-resources'
const examUrl = questions.find((q) => q.origin === 'official')?.source_url
const checkedAt = '2026-09-29'

const concepts = {
  '01': {
    topic: 'L21101', name: 'BERT 遮罩語言模型',
    cases: ['客服團隊想讓文字模型掌握句子前後文的用語', '保險理賠團隊整理大量敘述文字作為預訓練語料', '法務團隊需要模型理解合約句子中的雙向語境', '校務團隊整理問答文字，準備微調語言理解模型', '維運團隊在知識庫文字上建立預訓練流程'],
    ask: '若採用 BERT 的遮罩語言模型預訓練，下列哪項描述正確？',
    options: ['隨機遮住部分詞元，讓模型依上下文預測被遮蔽內容', '只讀取左側前文，逐詞預測下一個詞元', '把句子轉成詞頻向量後，以距離取代語境建模', '使用人工撰寫的同義詞表直接替換每個遮蔽詞元'], correct: 'A',
    explanation: 'BERT 的遮罩語言模型會遮蔽輸入中的部分詞元，並利用左右兩側的上下文學習預測內容。這讓編碼器能建立雙向語境表示；逐詞向右生成則是自回歸語言模型常見的訓練目標，兩者不可混為一談。',
    wrong: { B: '只看左側並預測下一詞是自回歸式目標，沒有呈現 BERT 遮罩預測利用左右語境的特點。', C: '詞頻向量是較淺層的表示方法，無法用上下文預測遮住的詞元，也不是 BERT 的遮罩訓練方式。', D: '同義詞表是人工規則替換，沒有讓模型從上下文學得詞元關係，因此不能代表遮罩語言模型。' },
    source: { title: 'BERT: Pre-training of Deep Bidirectional Transformers', url: 'https://arxiv.org/abs/1810.04805' },
  },
  '02': {
    topic: 'L21101', name: 'Transformer 自注意力',
    cases: ['客服紀錄很長，同一個代名詞要連回前文提到的商品', '合約條款跨越多段，模型需比對定義與後續義務', '病歷摘要中，晚近的處置要能參照先前病史', '技術文件使用跨段落指代，搜尋系統需掌握關聯文字', '會議逐字稿中，同一個議題在相隔多輪後再次出現'],
    ask: '若以 Transformer 的自注意力處理這段文字，哪項說明最符合其作用？',
    options: ['依詞元間的關聯計算注意力權重，形成包含上下文的表示', '固定只比較相鄰兩個詞元，其他位置一律不參與計算', '先把整段文字轉成詞頻，再依詞頻高低決定語意', '以循環狀態逐詞讀取，無法同時計算不同位置的關聯'], correct: 'A',
    explanation: '自注意力會根據輸入中的 Query、Key 與 Value 計算位置間的關聯權重，再聚合相關資訊形成新的表示。它不必像傳統循環網路一樣逐詞傳遞狀態；標準注意力也不等同於只看相鄰詞或統計詞頻。',
    wrong: { B: '只看相鄰位置描述的是受限的局部視窗，無法說明自注意力依輸入關係連結遠距位置的能力。', C: '詞頻統計忽略詞序與上下文，不會計算 Query、Key、Value 的關聯，也不是注意力權重。', D: '循環網路逐步傳遞狀態是另一種序列建模設計，Transformer 自注意力可直接關聯不同位置。' },
    source: { title: 'Attention Is All You Need', url: 'https://arxiv.org/abs/1706.03762' },
  },
  '03': {
    topic: 'L21101', name: '檢索增強生成（RAG）',
    cases: ['客服回答必須依照每週更新的退貨規章', '醫院流程問答需依最新核准的院內作業文件回答', '法務助理需從內部條文庫找出依據後再整理答覆', '員工服務入口常有新的人事規則，答案要能附文件出處', '產品支援內容隨版本更新，回覆需以現行手冊為準'],
    ask: '為降低答案與最新文件不一致的風險，哪種設計最適合？',
    options: ['先檢索相關文件片段，再把檢索內容與問題交給生成模型', '只在模型訓練時增加資料，部署後不再提供外部脈絡', '把生成模型改成關聯式資料庫，由資料庫直接撰寫自然語言', '只增加提示詞長度，要求模型自行記住所有新規章'], correct: 'A',
    explanation: 'RAG 會先從外部知識來源檢索與問題相關的內容，再將檢索結果提供給生成模型作為回答脈絡。這能讓系統使用可更新的知識並利於附上來源，但檢索品質、文件新舊與權限控管仍需另外驗證。',
    wrong: { B: '只更新訓練資料不能保證每次部署都包含最新文件；題目要處理的是推論時依現行知識回答。', C: '資料庫負責儲存與查詢資料，不會自動取代生成模型的語言理解和文字組織能力。', D: '提示詞要求模型記住新規章，仍未提供可查證的文件內容，也無法確保知識已更新。' },
    source: { title: 'Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks', url: 'https://arxiv.org/abs/2005.11401' },
  },
  '04': {
    topic: 'L21102', name: '電腦視覺物件偵測',
    cases: ['產線相機要找出刮痕並框出每個瑕疵的位置', '影像輔助判讀需標出疑似病灶所在區域', '路口影像分析要定位畫面中的車輛與行人', '倉儲相機需計數貨架上各類包裹並標示位置', '生態影像要找出動物個體並保留框選座標'],
    ask: '當任務同時要求辨識物件類別並指出位置，最合適的輸出是？',
    options: ['對每個物件預測類別與邊界框座標', '只對整張影像輸出一個主要類別', '為每個像素指派類別，但不輸出個別物件框', '只辨識影像中的文字字元並依序輸出'], correct: 'A',
    explanation: '物件偵測的典型輸出包含物件類別、位置邊界框與信心分數，能回答「是什麼」及「在哪裡」。整張圖分類不定位個別物件；語意分割標記像素類別但不一定形成物件框；OCR 則聚焦文字辨識。',
    wrong: { B: '整張影像分類只輸出全圖標籤，沒有逐個找出物件或提供位置座標。', C: '語意分割會標示像素所屬類別，但題目要求的是逐物件類別與邊界框的偵測結果。', D: 'OCR 以影像文字為辨識目標，不適用於定位一般物件或瑕疵。' },
    source: { title: 'Faster R-CNN: Towards Real-Time Object Detection with Region Proposal Networks', url: 'https://arxiv.org/abs/1506.01497' },
  },
  '05': {
    topic: 'L21103', name: '生成對抗網路（GAN）',
    cases: ['設計團隊希望生成新的商品外觀草圖', '研究團隊想產生與訓練影像相似的合成樣本', '美術團隊測試由隨機輸入生成不同風格圖片', '影像團隊評估一種以對抗訓練產生圖片的模型', '資料團隊研究如何讓合成影像逐漸接近真實影像分布'],
    ask: '關於 GAN 的生成器與判別器，下列敘述何者正確？',
    options: ['生成器嘗試產生逼真樣本，判別器嘗試分辨真實與生成樣本', '兩個網路都只負責把輸入影像壓縮成低維表示', '判別器先產生圖片，生成器再替圖片加上類別標籤', '生成器只讀取真實樣本，判別器只比較文字描述'], correct: 'A',
    explanation: 'GAN 由生成器與判別器進行對抗訓練：生成器試圖產生足以混淆判別器的樣本，判別器則學習辨別真實資料與生成資料。兩者透過競爭改善生成品質；這個機制不代表合成資料自然具備隱私保護或可直接取代真實驗證。',
    wrong: { B: '兩個網路都做壓縮是編碼器式流程，沒有描述生成器與判別器在真假辨識上的對抗目標。', C: '角色剛好顛倒；GAN 是生成器產生樣本，判別器評估真偽，不是判別器生成圖片。', D: '此描述把影像與文字任務混在一起，未呈現 GAN 對真實資料與合成資料的判別訓練。' },
    source: { title: 'Generative Adversarial Nets', url: 'https://arxiv.org/abs/1406.2661' },
  },
  '06': {
    topic: 'L21104', name: '圖文對比學習與共同嵌入空間',
    cases: ['使用者輸入文字搜尋最符合描述的商品照片', '圖書館希望用一句描述找出館藏封面影像', '設計平台要依文字提示排序相符的參考圖片', '無障礙服務要把影像和文字描述配對供檢索使用', '多媒體資料庫要用自然語言查找相關影片畫面'],
    ask: '若使用圖文對比式預訓練模型，哪種設計可支援文字與影像互相檢索？',
    options: ['分別編碼文字與影像，並在共同向量空間對齊相符配對', '先把影像轉成檔名，再只依字串完全相同進行搜尋', '把文字像素化後與影像直接串接，不訓練跨模態關係', '為每個固定商品類別建立獨立分類器，不保留文字表示'], correct: 'A',
    explanation: '圖文對比學習會將文字與影像分別編碼，再透過配對資料讓語意相符的表示在共同嵌入空間靠近、不相符的表示遠離。訓練後可用相似度支援跨模態檢索；它不只是檔名搜尋，也不等於固定類別分類器。',
    wrong: { B: '檔名字串搜尋依賴人工命名，不會從影像內容學到與自然語言描述相符的跨模態語意。', C: '直接串接原始數值而不學習模態間對應關係，不能形成可比較的文字與影像嵌入。', D: '固定分類器只涵蓋預先定義的類別，缺少通用文字表示與開放式跨模態相似度搜尋。' },
    source: { title: 'Learning Transferable Visual Models From Natural Language Supervision', url: 'https://arxiv.org/abs/2103.00020' },
  },
  '07': {
    topic: 'L21201', name: 'AI 導入可行性評估',
    cases: ['零售商考慮導入需求預測，希望減少缺貨與過量庫存', '客服主管評估自動分類案件是否能縮短平均處理時間', '製造業評估影像檢測能否降低人工複檢成本', '醫療單位探討排程預測前，需確認資料與作業條件是否成熟', '公部門評估導入文件分類前，需比較人工流程的現況成本'],
    ask: '在承諾擴大投資前，哪項做法最能支持是否導入 AI 的判斷？',
    options: ['先定義現況基準、可量測效益、資料可用性、總成本與主要風險', '先挑選排行榜最高的模型，再把業務流程改成符合模型輸出', '只以模型準確率作為成敗標準，不比較原流程或部署成本', '先購買最大規格的運算設備，再尋找可使用的業務問題'], correct: 'A',
    explanation: '導入評估要從具體業務問題出發，設定可量測的基準與預期效益，並檢查資料、人力、技術、總持有成本和風險。模型指標只是其中一部分，必須確認改善幅度是否足以抵銷導入與維運成本。',
    wrong: { B: '先定模型再硬改流程會倒置需求與方案的關係，無法證明問題需要 AI 或方案適合現場。', C: '單一準確率沒有反映基準效能、錯誤代價、流程採用與維運成本，不能獨立支撐投資決策。', D: '先採購設備把技術投入當成目標，沒有建立問題、效益與可行性的證據。' },
    source: { title: 'iPAS AI 應用規劃師中級學習指引：AI 導入評估', url: guideUrl },
  },
  '08': {
    topic: 'L21203', name: '資料最小化與隱私保護',
    cases: ['客服分類模型只需要問題文字與案件類別，不需身分證號', '行銷預測只需區域與購買紀錄，不需完整聯絡資訊', '院內流程分析只需去識別化的檢查代碼與時間', '職務分派模型不需讀取員工私人通訊內容', '服務品質統計只需彙總結果，不需保留個人姓名'],
    ask: '在資料設計階段，哪一項安排符合目的限制與資料最小化？',
    options: ['只蒐集完成明確目的所需的欄位，並限制存取與保存期限', '先保留所有可取得欄位，未來可能有用時再決定用途', '把識別資料複製到更多團隊共用，以增加模型可用訊號', '只要用於訓練，就不需要確認資料使用目的和保存期限'], correct: 'A',
    explanation: '資料最小化要求依明確目的限制蒐集範圍，只保留完成任務必要的欄位，並搭配適當存取控制與保存期限。移除或遮罩直接識別資訊可降低部分風險，但仍須評估重新識別、合法依據和整個資料生命週期。',
    wrong: { B: '以未來可能使用為由全面保留資料，沒有把蒐集範圍限制在目前明確目的所需之內。', C: '增加複本與存取者會擴大暴露面，與最小化及存取控制的方向相反。', D: '訓練用途不會自動免除目的、保存與合法性檢查，仍需依資料情境治理。' },
    source: { title: 'NIST AI Risk Management Framework: Trustworthiness Characteristics', url: 'https://airc.nist.gov/airmf-resources/airmf/3-sec-characteristics/' },
  },
  '09': {
    topic: 'L21301', name: '分組切分與資料洩漏',
    cases: ['同一病患的多張影像可能被分散到不同資料集', '同一客戶的多筆交易會重複出現在資料表中', '同一部機器的相鄰時間紀錄高度相似', '同一房屋的多張照片會被當成不同樣本', '同一份原始文件切出的片段會分散成多列資料'],
    ask: '為了避免測試成績過度樂觀，最適合的資料切分方式是？',
    options: ['先按病患、客戶或來源群組切分，再分配到訓練與測試集', '逐列隨機切分，確保每一列被視為彼此獨立樣本', '先用全部資料調整特徵，再切出測試資料評估模型', '把相似紀錄同時放入訓練與測試，增加測試樣本數'], correct: 'A',
    explanation: '當同一個體或來源含有多筆高度相關資料，應以群組為單位切分，避免相關樣本同時進入訓練與測試集。否則模型可能辨認已見過的個體或來源特徵，使測試結果高估對新個體的泛化能力。',
    wrong: { B: '逐列隨機切分會把同一群組的相似資料分到兩側，無法消除題目指出的群組洩漏。', C: '若特徵轉換或選擇先看過測試資料，測試資訊就已影響訓練流程，評估會失去獨立性。', D: '把高度相似的紀錄同時放入兩側正是造成洩漏的方式，樣本數增加不會使評估更可信。' },
    source: { title: 'scikit-learn: Common pitfalls and recommended practices', url: 'https://scikit-learn.org/stable/common_pitfalls.html' },
  },
}

const planningAndDeployment = [
  { topic: 'L21202', name: '工作分解與責任安排', context: '導入案涉及業務訪談、資料整理、模型驗證及系統上線，且每一階段有不同負責單位', ask: '專案負責人應先產出什麼，讓時程與責任可以追蹤？', options: ['將目標拆成可交付工作項目，標明負責人、依賴關係與驗收條件', '只列出所有參與者姓名，等開發結束後再分配工作', '先購買模型服務，再以供應商預設流程決定內部責任', '只設定最終上線日期，不拆解中間工作與檢查點'], correct: 'A', rationale: '可執行的規劃須把目標拆成可追蹤的工作與交付成果，並標明責任、前後依賴和驗收條件；只列人名或終點日期無法管理多部門工作。' },
  { topic: 'L21202', name: '敏捷短衝與假設驗證', context: '資料品質和模型效果尚不確定，團隊希望每隔數週向利害關係人展示可檢查的成果', ask: '哪種專案節奏最能及早暴露假設錯誤並吸收回饋？', options: ['採短週期迭代，每輪設定可驗證目標並檢視成果與流程', '先一次完成所有需求文件，專案結束前不展示中間成果', '每輪都改變成功指標，避免固定門檻限制模型表現', '等模型達到預期準確率後，才讓業務人員參與驗收'], correct: 'A', rationale: '短週期迭代讓團隊能以可檢查的成果驗證需求、資料與模型假設，並在回顧後調整下一輪工作。這對不確定性高的 AI 專案特別有用，且不代表可以省略穩定的成功指標。' },
  { topic: 'L21202', name: '自建、採購或委外評估', context: '機構正在比較商用 AI 服務、內部開發與委外，需求涉及個資、特殊流程和長期維護', ask: '選擇導入方式前，哪種比較最完整？', options: ['依需求適配、資料控制、內部能力、成本、時程與維護責任比較方案', '只比較第一年授權費，費用最低者一律最適合', '只看供應商展示的準確率，不檢查資料處理與整合條件', '優先選擇自建，因為自行開發一定比採購安全且便宜'], correct: 'A', rationale: '自建、採購與委外各有能力、控制、成本及維護取捨，需同時比較需求適配、資料規範、整合條件、時程與全生命週期成本。單一價格或供應商展示指標不足以支持選擇。' },
  { topic: 'L21302', name: '模型服務 API 與系統整合', context: '模型已完成驗證，前端和企業內部系統需要用一致方式取得推論結果', ask: '哪項安排最有助於可控地整合模型服務？', options: ['以版本化 API 封裝推論，定義輸入輸出、驗證、錯誤與監控契約', '直接把訓練程式複製到每台前端電腦執行', '讓每個呼叫端自行修改模型檔和前處理流程', '只提供模型權重檔，不定義服務介面與維運責任'], correct: 'A', rationale: '模型服務化以穩定介面提供推論，明確定義輸入輸出、版本、驗證、錯誤處理和監控，讓呼叫端能整合並讓維運團隊追蹤。只散發模型檔會使環境與前處理難以一致管理。' },
  { topic: 'L21302', name: '部署監控與回復機制', context: '新模型上線後，輸入分布可能改變且服務須維持可用，團隊需要安全更新方法', ask: '哪種作法最能控制新版本上線風險？', options: ['監控延遲、錯誤與資料分布，分階段釋出並保留回復舊版能力', '一次替換所有服務，不保留舊版本以避免混淆', '只在訓練完成時測一次，正式環境不再追蹤效能', '只監控伺服器是否開機，不檢查模型輸入和輸出品質'], correct: 'A', rationale: '部署後需同時觀察系統健康與模型相關指標，分階段釋出可限制新版本影響範圍，並以版本管理和回復方案處理退化。單看服務存活無法發現資料漂移或預測品質下降。' },
]

const sourceForPlan = { title: 'iPAS AI 應用規劃師中級學習指引：AI 導入規劃與系統部署', url: guideUrl }
const sourceForScrum = { title: 'The Scrum Guide', url: 'https://scrumguides.org/scrum-guide.html' }
const sourceForDeploy = { title: 'MLOps: Continuous delivery and automation pipelines in machine learning', url: 'https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning' }

function permuteOptions(options, correct, offset) {
  const order = ['A', 'B', 'C', 'D']
  const values = [...options]
  const correctText = values[0]
  const distractors = values.slice(1)
  const rotated = distractors.map((_, index) => distractors[(index + offset) % distractors.length])
  const finalValues = [...rotated]
  finalValues.splice(({ A: 0, B: 1, C: 2, D: 3 })[correct], 0, correctText)
  return Object.fromEntries(order.map((key, index) => [key, finalValues[index]]))
}

for (const question of questions) {
  if (question.subject !== 'L21' || question.origin === 'official') continue
  const match = question.id.match(/-(\d{2})-(\d)$/)
  if (!match) continue
  const [, group, indexText] = match
  const index = Number(indexText) - 1
  const mode = question.origin

  if (group === '10') {
    const concept = planningAndDeployment[index]
    const isDeployment = concept.topic === 'L21302'
    const options = permuteOptions([concept.options[0], ...concept.options.slice(1)], concept.correct, index % 3)
    const answer = Object.keys(options).find((key) => options[key] === concept.options[0])
    question.topic_ids = [concept.topic]
    question.stem = mode === 'exam_style'
      ? `${concept.context}。${concept.ask}`
      : `AI 專案${concept.name}：${concept.context}。${concept.ask}`
    question.options = options
    question.correct_option = answer
    question.explanation = `${concept.rationale}實作時還要確認每個交付成果有負責人和可檢查的完成條件，並定期依實際進度調整安排。`
    question.option_explanations = Object.fromEntries(Object.entries(options).map(([key, option]) => [key,
      key === answer ? `正確。${concept.rationale}` : `不適合：${option}。${concept.rationale}`,
    ]))
    question.source_label = mode === 'exam_style' ? '自編仿題：依歷屆單選情境題型設計，非原題' : `自編研究題：依學習指引「${concept.name}」與相關資料設計`
    question.style_reference = mode === 'exam_style' ? '歷屆情境單選題型' : null
    question.theory_sources = mode === 'guide_research' ? [sourceForPlan, ...(index === 1 ? [sourceForScrum] : []), ...(isDeployment ? [sourceForDeploy] : [])] : []
    question.verified_at = mode === 'guide_research' ? checkedAt : null
    question.tags = ['自編題', mode === 'exam_style' ? '仿歷屆題型' : '學習指引與理論']
    continue
  }

  const concept = concepts[group]
  if (!concept) continue
  const context = concept.cases[index]
  const options = permuteOptions(concept.options, concept.correct, index % 3)
  const answer = Object.keys(options).find((key) => options[key] === concept.options[0])
  question.topic_ids = [concept.topic]
  question.stem = mode === 'exam_style'
    ? `${context}。${concept.ask}`
    : `${concept.name}的觀念題：${context}。${concept.ask}`
  question.options = options
  question.correct_option = answer
  question.explanation = `${concept.explanation}本題情境的關鍵條件是「${context}」，因此應優先確認方法是否直接處理這項需求，並在實際導入時用適當資料與指標驗證成效。`
  question.option_explanations = Object.fromEntries(Object.entries(options).map(([key, option]) => [key,
    key === answer ? `正確。${question.explanation}` : `${concept.wrong[['A', 'B', 'C', 'D'][concept.options.indexOf(option)]]}題目情境為「${context}」，所以這個選項沒有滿足所需條件。`,
  ]))
  question.source_label = mode === 'exam_style' ? '自編仿題：依歷屆單選情境題型設計，非原題' : `自編研究題：依學習指引「${concept.name}」與相關理論設計`
  question.style_reference = mode === 'exam_style' ? '歷屆情境單選題型' : null
  question.theory_sources = mode === 'guide_research' ? [concept.source, { title: `iPAS AI 應用規劃師中級學習指引：${concept.topic}`, url: guideUrl }] : []
  question.verified_at = mode === 'guide_research' ? checkedAt : null
  question.tags = ['自編題', mode === 'exam_style' ? '仿歷屆題型' : '學習指引與理論']
}

await writeFile(path, `${JSON.stringify(questions, null, 2)}\n`, 'utf8')
console.log('Updated the 100 authored L21 question records.')
