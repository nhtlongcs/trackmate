import logging

logging.basicConfig(format="%(levelname)s %(asctime)s %(name)s %(message)s", level=logging.INFO)
logger = logging.getLogger()
logging.getLogger('httpx').setLevel(logging.WARNING)
logging.getLogger('httpcore').setLevel(logging.WARNING)
