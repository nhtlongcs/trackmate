import json
from argparse import ArgumentParser

from agno.agent import Agent
from agno.tools.googlesheets import GoogleSheetsTools
from rich import print
from rich.console import Console
from rich.json import JSON
from rich.panel import Panel
from rich.prompt import Prompt

from agents.chat import create_agent
from auth.google import auth_google_installed_app_flow

console = Console()
auth_google_installed_app_flow(scopes=[GoogleSheetsTools.DEFAULT_SCOPES["read"]])


def print_messages(agent: Agent):
    """Print the current chat history in a formatted panel"""
    console.print(
        Panel(
            JSON(
                json.dumps(
                    [
                        m.model_dump(include={"role", "content"})
                        for m in agent.memory.messages
                    ]
                ),
                indent=4,
            ),
            title=f"Chat History for session_id: {agent.session_id}",
            expand=True,
        )
    )


def parse_args():
    parser = ArgumentParser()
    parser.add_argument("-d", "--debug", action="store_true")
    parser.add_argument(
        "--session",
        type=str,
        required=False,
        help="Session ID to continue the previous chat messages",
    )
    parser.add_argument("--show_messages", action="store_true")
    parser.add_argument(
        "-u",
        "--user",
        type=str,
        required=False,
        default="guest",
        help="User ID to separate chat sessions and messages",
    )
    args = parser.parse_args()
    return vars(args)


def main():
    args = parse_args()
    user = args.get("user", None) or None
    session = args.get("session", None) or None
    agent = create_agent(user, session)

    print("Chat with an Agent. Enter exit/quit/bye to stop chatting")
    exit_on = ["exit", "quit", "bye"]
    while True:
        message = Prompt.ask(f"[bold] :sunglasses: {user or 'you'} [/bold]")
        if message in exit_on:
            break

        agent.print_response(message=message, stream=True, markdown=True)
        if args["show_messages"]:
            print_messages(agent)


if __name__ == "__main__":
    main()
