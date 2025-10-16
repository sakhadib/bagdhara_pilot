Making of Dataset bagdhara_: A Comprehensive Computational Corpus of Bangla Idioms for Figurative Language Processing
bagdhara_, a large-scale, meticulously annotated corpus comprising 10,361 Bangla idioms. As a critical resource, it operationalizes the expressive, metaphor-rich dimension of the Bangla language for computational analysis. Idioms, as complex linguistic phenomena, exhibit semantic non-compositionality where intended meaning diverges from literal interpretation, thereby encapsulating the shared cognitive, cultural, and affective experiences of a linguistic community. The bagdhara_ dataset is engineered to serve as a foundational knowledge base for advancing research in natural language processing, computational linguistics, and the digital humanities.
1. Introduction and Motivation: Addressing a Critical Lacuna in NLP Resources
Despite Bangla's rich literary and poetic heritage, the language remains significantly under-resourced in Natural Language Processing (NLP), particularly concerning figurative language. This scarcity of structured, digitized, and annotated corpora for Bangla idioms presents a substantial barrier to advancing semantic understanding, machine translation, sentiment analysis, and cultural modeling. The bagdhara_ corpus was conceived to address this critical lacuna by transforming a domain rich in cultural heritage but poor in computational resources into a machine-interpretable knowledge base.
The primary objective is to enable Artificial Intelligence models and Large Language Models (LLMs) to master the figurative semantics, pragmatic contexts, and cultural worldviews encoded within idiomatic expressions. This dataset complements kobita_ (poetry) and probad_ (proverbs), forming a foundational triptych for Bangla cultural linguistics that encodes the poetic, moral, and idiomatic intelligence of the language for computational humanities and next-generation NLP.
2. Scope and Taxonomical Framework of the Dataset
The bagdhara_ corpus systematically delineates idioms from classical, folk, and contemporary Bangla usage. Its construction ensures a comprehensive taxonomic representation across several axes:
Regional Variation: Encompasses Standard Bangla alongside significant regional idiomatic variations.
Functional Domains: Covers idioms pertinent to diverse contexts, including quotidian speech, literature, media, agriculture, and education.
Temporal Depth: Captures both contemporary idioms and historically significant expressions to facilitate diachronic linguistic analysis.
Each entry within the corpus is structured with multi-layered annotations, including:
The canonical idiom in Bangla script.
Disambiguated literal and figurative meanings in both Bangla and English.
Cross-lingual parallels, specifically functionally equivalent English idioms.
Contextualized usage examples in both Bangla and English.
A classification schema of semantic tags, functional domains, and sentiment polarity.
Metadata flags for cultural, historical, and religious significance.
Socio-spatial context annotations (e.g., urban, rural, domestic, occupational).
With 10,361 unique idioms documented over three centuries of linguistic evolution, bagdhara_ constitutes the largest and most granular idiomatic resource for the Bangla language to date.
3. Dataset Architecture and Schema
Each idiom is encoded using a uniform JSON schema designed for linguistic and semantic granularity, ensuring robust computational parsing and model training.

```
{
  "id": "integer",
  "idiom": "string",
  "alternative_idioms": ["string"],
  "literal_meaning": "string",
  "figurative_meaning_bn": "string",
  "figurative_meaning_en": "string",
  "similar_in_english": ["string"],
  "example_sentences_in_bangla": ["string"],
  "example_sentences_in_english": ["string"],
  "usage_domain": ["string"],
  "tags": ["string"],
  "frequency": "string",
  "sentiment": "string",
  "historical_significance": "boolean",
  "religious_significance": "boolean",
  "cultural_significance": "boolean",
  "scape": "string",
  "history": ["string"],
  "note": "string"
}
```

3.1. Schema Justification: A Framework for Modeling Figurative Semantics
Idioms represent a formidable challenge for NLP due to their non-compositional nature. The bagdhara_ schema is architected to explicitly partition and encode the requisite semantic, pragmatic, and sociocultural information.
Core Semantic Mapping: The idiom, literal_meaning, and figurative_meaning_* fields establish a triad that maps denotation to connotation, enabling models to learn the semantic shift from literal to figurative interpretations. The similar_in_english field provides cross-lingual anchors for machine translation and analogical reasoning tasks.
Pragmatic Contextualization: example_sentences_in_bangla and example_sentences_in_english situate idioms within authentic linguistic environments, a prerequisite for training context-aware comprehension models. The usage_domain and tags fields further classify idioms by pragmatic function and thematic relevance (e.g., “anger,” “irony,” “patience”).
Sociocultural and Affective Metadata: Boolean flags for historical_significance, religious_significance, and cultural_significance capture symbolic context and enable the study of diachronic meaning shifts. The sentiment field categorizes idioms as positive, negative, neutral, or sarcastic to support advanced emotion recognition and sentiment modeling.
Socio-Spatial Annotation: The scape field defines the socio-spatial domain (urban, rural, folk, occupational, literary), facilitating comparative analysis of idiomatic variation across diverse socio-geographic contexts.
Diachronic and Ethnolinguistic Data: The history field preserves oral or textual provenance, linking idioms to specific historical events or social transformations. The note field retains ethnolinguistic commentary, enhancing the dataset's value for digital humanities and anthropological linguistics.
4. Corpus Construction Methodology
The construction of bagdhara_ followed a rigorous, multi-phase protocol.
Phase 1: Corpus Aggregation and Normalization: Data was aggregated from a wide range of authoritative sources, including Bangla Academy idiom dictionaries, regional folk collections, academic theses, educational materials, crowdsourced speech transcripts, and digital literary archives. All entries were manually verified, and orthography was normalized to Standard Bangla Unicode (UTF-8).
Phase 2: Semantic and Cultural Annotation: A specialized team of linguists and literature scholars conducted a multi-layered annotation process for each idiom, assigning figurative meanings, usage domains, sentiment, and sociocultural attributes. For each entry, two representative contextual examples were curated.
Phase 3: Review and Validation: A high threshold for inter-annotator agreement (>90%) was enforced to ensure data integrity. Historical entries were cross-validated against authoritative reference materials. The final dataset was compiled in JSON v1.0, ensuring full UTF-8 compliance.
5. Pilot Benchmarking of SOTA LLMs
We have carefully chosen 11 sota models on openrouter and also carefully picked 100 idioms from the set. These 100 idioms are well used in bangla laguage and has significant importance in bangla literary and figurative language. 

Models
qwen/qwen3-vl-8b-instruct
x-ai/grok-4-fast
google/gemini-2.5-flash
deepseek/deepseek-chat-v3.1
openai/gpt-4.1
mistralai/mistral-medium-3.1
meta-llama/llama-3.3-70b-instruct
meta-llama/llama-4-scout
mistralai/mixtral-8x22b-instruct
openai/chatgpt-4o-latest
google/gemma-3-12b-it
anthropic/claude-haiku-4.5
thedrummer/cydonia-24b-v4.1
qwen/qwen3-max
alibaba/tongyi-deepresearch-30b-a3b
arcee-ai/afm-4.5b
x-ai/grok-3-mini
meituan/longcat-flash-chat
moonshotai/kimi-k2-0905
baidu/ernie-4.5-21b-a3b
z-ai/glm-4.5
google/gemini-2.5-flash-lite
minimax/minimax-m1
google/gemma-3n-e4b-it
meta-llama/llama-4-maverick
thedrummer/skyfall-36b-v2
mistralai/mistral-saba
amazon/nova-pro-v1
meta-llama/llama-3.1-405b-instruct
anthropic/claude-3.5-sonnet

We have given zeroshot chance to each model and asked what it understands by the idiom if it sees the use of the “word(s)” in a Bangla text. It has responded , we recorded and then the evaluation board of 

5. Research Trajectories and Application Domains
The bagdhara_ dataset is poised to facilitate a broad spectrum of research and applied NLP tasks:
NLP and Machine Learning:
Idiom Recognition and Disambiguation: Training models to differentiate between literal and idiomatic usage in context.
Machine Translation (MT): Mitigating literal translation errors by providing functionally equivalent targets.
Figurative Language Understanding: Enhancing model capabilities in interpreting metaphor, irony, and hyperbole.
Sentiment and Pragmatic Analysis: Enabling fine-grained affective and tonal modeling in Bangla text.
Cultural and Cognitive Linguistics:
Conceptual Metaphor Analysis: Investigating the cognitive mappings that underpin Bangla idioms.
Cultural Cognition Studies: Analyzing the moral, ethical, and social reasoning embedded in idiomatic expressions.
Diachronic Semantics: Tracking the evolution of idiomatic meaning in response to historical events.
Cross-Lingual and Educational Applications:
Multilingual AI: Serving as a cornerstone for building parallel idiom corpora across languages.
Language Pedagogy: Functioning as an interactive database for advanced language learning tools.
Digital Archiving: Preserving endangered idiomatic heritage and regional linguistic diversity.
6. Conclusion and Significance
The bagdhara_ dataset represents the first computationally tractable, large-scale corpus of Bangla idioms, creating a vital bridge between linguistic form, figurative meaning, and cultural context. Its primary contribution is to advance the state-of-the-art by:
Enabling the fine-tuning of Bangla LLMs for robust idiomatic understanding.
Facilitating cross-cultural metaphor alignment for sophisticated machine translation and reasoning.
Strengthening AI interpretability through the integration of culturally grounded semantics.
Positioned alongside kobita_ and probad_, the bagdhara_ dataset completes a triadic foundation for computational Bangla cultural linguistics, effectively transforming intangible linguistic heritage into structured, actionable digital intelligence.
