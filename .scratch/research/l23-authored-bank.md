# L23 自編題庫研究與來源紀錄

> 範圍：科目「機器學習技術與應用」中 50 題仿歷屆題型及 50 題學習指引理論研究題；本筆記記錄本次修訂後 guide_research 題的理論依據與題庫去重方法。查證日期：2026-09-29。

## 題庫整理結果

原題庫的 50 題 `guide_research` 與 50 題 `exam_style` 是逐題成對的相同題幹、選項與正解，只在前綴和來源標籤不同。本次將 50 題 `guide_research` 全部換成不同概念，保留既有 ID 與 50/50 分類。依題幹去除題型前綴後，兩池沒有完全相同的題幹；題目概念分布涵蓋 12 個 L23 指引章節。這項字串比對只排除完全相同題幹，不能當作語意去重的形式證明。

官方學習指引：科目 3 範圍依 3.1 統計與機率、3.2 線性代數、3.3 最佳化、4.1 學習設定、4.2 傳統演算法、4.3 神經網路、5.1 前處理、5.2 驗證設計、5.3 評估指標、5.4 模型選擇、6.1 隱私、6.2 公平性整理。題目將指引範圍與一手文件或原始研究中的可核查概念結合。

## 第一手來源與支持範圍

| 題目 | 來源 | 可支持的觀念 |
|---|---|---|
| 001–004 | [NIST/SEMATECH e-Handbook of Statistical Methods](https://www.itl.nist.gov/div898/handbook/) | 描述統計、假設檢定、信賴區間及共變異數等基礎統計概念。 |
| 005 | [NumPy `matmul`](https://numpy.org/doc/stable/reference/generated/numpy.matmul.html) | 矩陣乘法的維度相容條件與輸出形狀。 |
| 006–008 | [NumPy linear algebra routines](https://numpy.org/doc/stable/reference/routines.linalg.html), [NumPy `eig`](https://numpy.org/doc/stable/reference/generated/numpy.linalg.eig.html), [NumPy `linalg.norm`](https://numpy.org/doc/stable/reference/generated/numpy.linalg.norm.html) | 可逆/滿秩關係、特徵向量定義及 L1/L2 範數。 |
| 009 | [Boyd & Vandenberghe, *Convex Optimization*](https://web.stanford.edu/~boyd/cvxbook/) | 凸函數局部最小值為全域最小值；非嚴格凸不保證唯一解。 |
| 010–011 | [PyTorch autograd tutorial](https://docs.pytorch.org/tutorials/beginner/basics/autograd_tutorial.html), [PyTorch optimizer documentation](https://docs.pytorch.org/docs/stable/optim.html) | 計算圖反向傳播與梯度、梯度清除及最佳化器角色。 |
| 012 | [OpenAI Spinning Up: Key Concepts in RL](https://spinningup.openai.com/en/latest/spinningup/rl_intro.html) | 智能體、環境、動作與回饋構成強化式學習問題。 |
| 013 | [自監督表示學習原始論文（arXiv:1901.10946）](https://arxiv.org/abs/1901.10946) | 從資料本身構造預測任務作為表示學習訊號。 |
| 014 | [PyTorch Transfer Learning Tutorial](https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html) | 將預訓練模型用於目標任務及微調流程。 |
| 015 | [Sugiyama et al., Learning under Non-Stationarity](https://www.jstage.jst.go.jp/article/jjssj/44/1/44_113/_article/-char/en) | Covariate shift：輸入分布改變，但輸入與標籤的條件關係維持不變。 |
| 016–020 | [scikit-learn clustering](https://scikit-learn.org/stable/modules/clustering.html), [decision trees](https://scikit-learn.org/stable/modules/tree.html), [ensembles/bagging](https://scikit-learn.org/stable/modules/ensemble.html#bagging), [pairwise metrics/RBF kernel](https://scikit-learn.org/stable/modules/metrics.html#rbf-kernel) | K-means 中心更新、DBSCAN noise、Gini impurity、bagging 重抽樣及 RBF 核公式。 |
| 021 | [PyTorch CIFAR-10 tutorial](https://pytorch.org/tutorials/beginner/blitz/cifar10_tutorial.html) | 卷積層與共享卷積權重的影像模型用途。 |
| 022 | [TensorFlow `conv2d`](https://www.tensorflow.org/api_docs/python/tf/nn/conv2d) | padding、stride 與卷積輸出空間尺寸的關係。 |
| 023 | [Vaswani et al., *Attention Is All You Need*](https://arxiv.org/abs/1706.03762) | Transformer 位置資訊及注意力架構。 |
| 024 | [PyTorch `CrossEntropyLoss`](https://pytorch.org/docs/stable/generated/torch.nn.CrossEntropyLoss.html) | 多類別交叉熵的 logits 輸入契約。 |
| 025–028 | [scikit-learn preprocessing](https://scikit-learn.org/stable/modules/preprocessing.html), [imputation](https://scikit-learn.org/stable/modules/impute.html) | 名目類別編碼、訓練折 fit 補值、穩健尺度轉換及樣本正規化。 |
| 029–032 | [scikit-learn cross-validation](https://scikit-learn.org/stable/modules/cross_validation.html), [nested CV example](https://scikit-learn.org/stable/auto_examples/model_selection/plot_nested_cross_validation_iris.html) | Nested CV、重複切分、時間序列切分與 group-wise 驗證。 |
| 033–036 | [scikit-learn model evaluation](https://scikit-learn.org/stable/modules/model_evaluation.html) | Specificity、ROC AUC、macro averaging 與迴歸誤差指標。 |
| 037–040 | [scikit-learn grid search](https://scikit-learn.org/stable/modules/grid_search.html), [classification threshold tuning](https://scikit-learn.org/stable/modules/classification_threshold.html) | 超參數網格及依應用錯誤代價調整分類閾值。 |
| 041–042 | [learning curves](https://scikit-learn.org/stable/modules/learning_curve.html), [SVM](https://scikit-learn.org/stable/modules/svm.html) | 學習曲線診斷及 SVC 的 C 懲罰參數取捨。 |
| 043 | [Bonawitz et al., Practical Secure Aggregation](https://research.google/pubs/practical-secure-aggregation-for-privacy-preserving-machine-learning/) | 聚合多方更新而避免直接揭露單一參與方更新的協定目標。 |
| 044 | [NIST: Protecting Trained Models in Privacy-Preserving Federated Learning](https://www.nist.gov/blogs/cybersecurity-insights/protecting-trained-models-privacy-preserving-federated-learning) | 聯邦模型或更新仍可能洩漏訓練資料資訊。 |
| 045 | [GDPR Article 4](https://gdpr-info.eu/art-4-gdpr/) | 假名化定義及與不可識別資料的區別。 |
| 046 | [Hardt, Price & Srebro, Equality of Opportunity in Supervised Learning](https://arxiv.org/abs/1610.02413) | Equalized odds 與條件錯誤率的定義。 |
| 047 | [Chouldechova, Fair prediction with disparate impact](https://arxiv.org/abs/1609.05807) | 群體校準與其他公平條件間的區別及取捨。 |
| 048–049 | [NIST AI RMF Core, Measure function](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/) | 按群體評估、記錄公平性與偏誤結果，以及將代表性納入評估。 |
| 050 | [Kusner et al., Counterfactual Fairness](https://arxiv.org/abs/1703.06856) | 固定其他條件、對照敏感屬性變化的反事實公平概念。 |

## 限制

題庫的題幹、答案及解析為編者設計，不是官方試題或官方解答。來源支持列出的理論主張，不代表每個選項文字都出現在來源原文。尤其偏誤與公平性題目需依使用情境界定適用準則；題目已避免宣稱單一指標能證明全面公平。部分來源為原始論文預印本或官方工具文件，讀者可由連結查閱完整假設與限制。
