"use client";

import type { ElectionFeedMessage as ElectionFeedMessageType } from "./mockMessages";
import { formatMessageTime } from "./formatMessageTime";

type Props = {
  msg: ElectionFeedMessageType;
  isNewest: boolean;
};

export function ElectionFeedMessage({ msg, isNewest }: Props) {
  return (
    <article
      className="election-feed__message"
      data-newest={isNewest ? "true" : "false"}
    >
      <header className="election-feed__message-head">
        <span className="election-feed__message-poster">{msg.poster}</span>
        <span className="election-feed__message-time">
          <time dateTime={msg.postedAt}>{formatMessageTime(msg.postedAt)}</time>
        </span>
      </header>

      <p className="election-feed__message-body">{msg.text}</p>

      <p className="election-feed__message-anchor">
        <span className="election-feed__message-anchor-pu">
          {msg.anchor.pollingUnitName}
        </span>
        <span aria-hidden="true" className="election-feed__message-anchor-sep">
          ·
        </span>
        <span>{msg.anchor.lga}</span>
        <span aria-hidden="true" className="election-feed__message-anchor-sep">
          ·
        </span>
        <span>{msg.anchor.state}</span>
      </p>
    </article>
  );
}
