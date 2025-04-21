+++
title = "How I use AI"
[taxonomies]
tags = [ "AI", "ChatGPT", "LLM"]
+++

Nowadays, it's hard to come across a young person that has at least heard of ChatGPT or other AI tools. AI, more specifically large language models (LLMs), is being integrated into many of our favorite existing online tools, like Google, Grammarly, Zoom, and Slack. However, these tools have been associated with cheating on homework assignments, writing shitty essays, and coming up with poor equations to calculate tariff rates. All this negative press has given users of AI tools a certain amount of shame in admitting their use. In many fields, especially in science, intelligence and productivity are traits that give you worth. If you're seen outsourcing these core skills to AI, what unique value are you bringing? I don't hide my AI use. Instead, I want to explain how I use it to enhance my skills and why I consciously limit its role in certain tasks, ensuring my critical thinking and unique perspective always drive the final outcome.

### It knows everything<sup>1</sup>

LLMs are incredibly knowledgeable about almost everything. This is because the data that they are trained on encapsulates the entire internet, a span of knowledge that no one human could possibly remember. This is great because our human lives are bundles of tasks that have very different knowledge bases. Knowing how to do taxes is very different from knowing how to cook a turkey is very different from knowing the stretches that will alleviate the soreness in certain muscle groups. While a human can be knowledgeable across a wide range of tasks, as the number of tasks you have to know approaches infinity<sup>2</sup>, your average knowledge of them approaches zero. AI has no such limitations. It is now OK to not be knowledgeable about things. Instead of outsourcing your taxes to Turbotax and paying the premium, ask ChatGPT to guide you through your taxes. Chat (nickname my girlfriend gave it) will tell you what to put down for each box on each form if you give it enough context about your income and other associated details. You can then ask it to help you maximize your tax return for this year, and what steps to take to maximize your return for next year. You can fill out your taxes like an expert, with zero prior knowledge<sup>3</sup>. 

Many people avoid going to the doctor due to fear, cost, or inconvenience. LLMs are trained on a wealth of medical texts and can therefore help you begin to diagnose yourself. There are testimonials on social media about people who have been bouncing around from specialist to specialist who couldn’t diagnose them, but Chat was able to. This is partly due to the accessibility and large context window of these models. Since Chat is so accessible, it's easy to pull out your phone and consult it the moment you experience a symptom. You can then have a conversation with it to find out what triggers could have caused your symptoms in the moment. Humans, patients and doctors alike, have flawed memories. Chat, however, remembers everything perfectly. It can correlate events over long periods, potentially finding patterns in health data to help sus out a diagnosis<sup>4</sup>. 

As an amateur researcher, I am still learning about my field and adjacent fields. Chat can help with this. When I encounter a paper outside my field, I can feed it into Chat with a prompt like: 'Explain this paper in terms a synthetic biologist would understand, defining all field-specific lingo”. While it's a good primer, make sure to actually read the paper over with your new understanding, as Chat can misunderstand things. 

### Its knowledge is broad and deep, but not that deep

You can ask Chat about virtually anything, and it will be able to tell you a lot about that topic! If you start to probe it in areas that you are very knowledgeable about, you will start to notice its flaws. For example, I am knowledgeable about synthetic biology and often use Chat to help me with my research. Its suggestions for general protocols on well-studied microbes are great. But when I'm engineering a microbe with less published research, Chat falters. This is not its fault, as there isn’t much in its training data on that microbe, but Chat can “hallucinate” and give you really bad advice because it doesn’t know what it doesn’t know. This is something that I have heard OpenAI and other AI companies are working on. LLMs (in their current form) are imperfect. If you are an expert in something, trust yourself. This is why I am sure that AI tools are just tools, and cannot replace human logic, intuition, and intelligence. They can help you do simple things outside of your realm of knowledge, but cannot (yet) replace you.

### The prompt is everything

The response that LLMs can give you is only as good as the prompt you give them. Better prompts will return better and more useful responses. A useful tip: Imagine giving your prompt to a real person who knows nothing about your context. Based only on your prompt, could they do what you want? Be specific in your prompt and don’t be afraid for it to become lengthy, but remain focused, as LLMs can take an unrelated detail you added and really run with it, screwing up your response. 
	
If you want to get even more complex with your prompts and become a true prompt engineer, you can use content tags, like in HTML or XML. When you tag the information in your prompt and provide a layout for Chat’s response, the LLM doesn’t have to decode your natural language into distinct pieces of information, leading to a response closer to your instructions. Here is an example prompt using tags:

```text 
<task>
Summarize the following research article in 3 bullet points.
</task>

<article_title>
ARTICLE TITLE HERE
</article_title>

<article_text>
ARTICLE TEXT HERE
</article_text>

<answer_format>
Each bullet point should be one sentence.
Focus on methods and key findings.
</answer_format>
```
### A note on using LLMS for writing

LLMs are awful at writing (for now). Just like humans, LLMs have biases for certain phrasing and words. Classic examples of “AI” words are“delve”, “nuanced”, “multifaceted”, and “delineate”. This is not a conclusive list that I can find but a quick google search can yield many more examples. If giving examples after a phrase like “such as”, LLMs tend to consistently provide 3 examples and use the oxford comma. AI generated paragraphs are made of sentences that are all similar length and always have an intro sentence and conclusion sentence, no matter the length of the paragraph. If you think a piece of writing that an LLM generated for you is a good final product, it's not. Every iteration of LLM is getting better and no doubt one day AI writing will be indistinguishable from human writing, but for now, it sucks. 

One part of the writing process that I do use it for is evaluation. During evaluation, especially if you provide the criteria to evaluate the piece on, the LLM casts aside its biases and is a great editor. Point to specific parts of your writing that you want to brush up, synonyms that match the voice and flow of the piece, and more. As someone who struggles with editing, it's a godsend. 

If you are a good editor but have trouble just putting initial words on the page, Chat can help with that too! You can provide Chat an outline and the bullet points that you wish to write about and it will generate a decent first draft. Just make sure to augment its writing enough so that the “AI” is not in the writing anymore.

### Do not let AI replace your humanity

AI was supposed to clean the dishes and cook your dinner to free up your time to make music and paint. The reality of AI is that it creates music and art and leaves you to clean the dishes and cook dinner. There is a worrying trend of offloading creative tasks, even in science, to AI and reserving work in the physical world for humans. Dear reader, I encourage you to hold onto your humanity as tightly as you can. If you’re struggling to come up with a gift to give your grandma on her 90th birthday, continue to struggle. Write that poem for your girlfriend, finish that harmony you made in your head, and sketch out your vision onto a canvas. Yes, it is easier to ask Chat to write one for you, but that's the point. A little bit of struggle is what makes the human experience more enjoyable and kills our increasingly common boredom.

---

1. It doesn’t know everything
2. Are there an infinite amount of distinct tasks? I suspect so. Email me if you have counter points. 
3. Not financial advice. If an AI model fucks up your taxes I am not responsible.
4. Call 911 if you’re experiencing any health emergency. Also, if an AI kills you I am not responsible.