# L21 Authored Question Sources

Checked: 2026-09-29. Scope: L21 guide sections 3.1–5.2. The official guide names nine subsections: L21101–L21104, L21201–L21203, and L21301–L21302. Source selection below maps technical claims to primary papers, official framework publications, or first-party technical documentation.

| Guide topic | Direct source | Claim supported |
|---|---|---|
| L21101 NLP | https://huggingface.co/docs/transformers/tasks/token_classification | Token classification and named-entity recognition task framing and token labeling |
| L21101 NLP | https://huggingface.co/docs/transformers/tasks/masked_language_modeling | Masked-language-model training and masked-token prediction |
| L21101 NLP | https://scikit-learn.org/stable/modules/feature_extraction.html#text-feature-extraction | Bag-of-words and TF-IDF text feature representations |
| L21102 CV | https://pytorch.org/tutorials/beginner/transfer_learning_tutorial.html | Transfer learning and fine-tuning image classifiers |
| L21102 CV | https://pytorch.org/vision/stable/generated/torchvision.transforms.Normalize.html | Per-channel image normalization with supplied mean and standard deviation |
| L21102 CV | https://scikit-learn.org/stable/modules/model_evaluation.html | Classification metrics and precision/recall definitions |
| L21103 Generative AI | https://arxiv.org/abs/1406.2661 | GAN generator/discriminator adversarial training |
| L21103 Generative AI | https://arxiv.org/abs/2006.11239 | Denoising diffusion probabilistic models |
| L21103 Generative AI | https://owasp.org/www-project-top-10-for-large-language-model-applications/ | Prompt injection and LLM application risks |
| L21104 Multimodal AI | https://arxiv.org/abs/2103.00020 | CLIP image/text encoders, contrastive pairing, zero-shot transfer |
| L21104 Multimodal AI | https://arxiv.org/abs/1706.03762 | Attention mechanism and scaled dot-product attention |
| L21201–L21203 AI planning/risk | https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-1.pdf | Risk framing, context, governance, measurement, human oversight, and risk response in AI RMF 1.0 |
| L21201–L21203 AI planning/risk | https://www.nist.gov/privacy-framework | Privacy risk management and organizational privacy outcomes |
| L21301 Data/model selection | https://scikit-learn.org/stable/common_pitfalls.html | Data leakage pitfalls and train-only fitting of preprocessing |
| L21301 Data/model selection | https://scikit-learn.org/stable/modules/cross_validation.html | Cross-validation, data splitting, and evaluation procedure |
| L21302 Deployment | https://mlflow.org/docs/latest/ml/model-registry/workflow/ | Model registry versions, metadata, aliases, and promotion workflows |
| L21302 Deployment | https://mlflow.org/docs/latest/ml/deployment/ | Model packaging, containers, and serving endpoints |
| L21302 Deployment | https://cloud.google.com/architecture/mlops-continuous-delivery-and-automation-pipelines-in-machine-learning | Continuous delivery and automation patterns for ML pipelines |

Use the source closest to each individual theory claim; the table is not evidence that every linked page supports every question. Some planning practices in the guide are operational recommendations rather than universally prescribed technical standards; questions should test the specific practice stated in the linked framework or documentation and avoid claiming it is the only acceptable organizational choice.

## Current bank review baseline

At the beginning of this pass, the authored pools contained 50 rows each, but both pools had the same topic distribution: L21101 had 15 rows; L21102, L21103, L21104, L21201, L21203, and L21301 had 5 each; L21202 had 3; L21302 had 2. Sampled L21101 rows repeated the same BERT masked-language-model concept across multiple business contexts and repeated the same correct option. The pool therefore needs content-level review; changing only the scenario nouns would not resolve concept duplication.

Official media review: 114 PDF had 14 pages and no embedded images. 115 PDF had 15 pages; each page had a repeated 1084×454 image consistent with a watermark. Page 6 also had a separate 838×401 image at the Q19 location containing chart content referenced by the question. The chart image must be reviewed with Q19; the image is not decorative. The question record is `l21-official-115-19`, `source_pdf_page: 6`. The chart values were transcribed into the question stem from the visual: AUC 0.91 after deployment (no prior value shown), CTR 3.2% to 3.1%, average order amount $850 to $1,020, average inference latency 85 ms, and monthly inference cost $12,000. The chart is represented as text in the stem and `needs_manual_media_review` is false.


## Authored pool update

Both authored pools now contain 50 distinct concept labels, with no exact label overlap between the pools. The exam_style pool covers L21101 6, L21102 6, L21103 6, L21104 6, L21201 5, L21202 5, L21203 5, L21301 6, and L21302 5. The guide_research pool covers L21101 5, L21102 5, L21103 5, L21104 5, L21201 5, L21202 5, L21203 5, L21301 7, and L21302 8.

Each research question carries direct first-party or primary source URLs; source groups are mapped above to the claims they support. The revised L21102 concept 影像通道正規化 uses the PyTorch Normalize API documentation for its per-channel mean/std transform. Each authored row has one keyed answer, an explanation and A–D option explanations; exam_style rows identify the L21 four-option scenario format in style_reference. The first 10 guide questions are also saved in .scratch/research/l21_research_batch.json for inspection.

The official media note above now records the chart values transcribed into the L21 Q19 stem. Its manual media flag is cleared because the essential chart data is represented in text.
