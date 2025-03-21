# https://github.com/run-llama/llama_cloud_services/blob/main/parse.md

import os
import rich
import nest_asyncio
from llama_cloud_services import LlamaParse

from dotenv import load_dotenv
load_dotenv()
nest_asyncio.apply()

def ocr_single(filepath, premium=False, verbose=False):
    parser = LlamaParse(
        api_key=os.getenv('LLAMA_CLOUD_API_KEY'),
        result_type="markdown",  # "markdown" and "text" are available
        num_workers=4, # if multiple files passed, split in `num_workers` API calls
        verbose=verbose,
        premium_mode=premium, # https://docs.cloud.llamaindex.ai/llamaparse/parsing/parsing_modes
        language="en",  # Optionally you can define a language, default=en
    )
    
    documents = parser.load_data(filepath)
    if verbose:
        rich.print(documents[0].text_resource.text)
    return documents[0].text_resource.text

def ocr_batch(filepaths, premium=False, verbose=False):
    parser = LlamaParse(
        api_key=os.getenv('LLAMA_CLOUD_API_KEY'),
        result_type="markdown",  # "markdown" and "text" are available
        num_workers=4, # if multiple files passed, split in `num_workers` API calls
        verbose=verbose,
        premium_mode=premium, # https://docs.cloud.llamaindex.ai/llamaparse/parsing/parsing_modes
        language="en",  # Optionally you can define a language, default=en
    )
    
    documents = parser.load_data(filepaths)
    return [document.text_resource.text for document in documents]

if __name__ == '__main__':
    ocr_single("./img.jpg")