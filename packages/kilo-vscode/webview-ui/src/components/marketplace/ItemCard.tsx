import { Component, Show, For, createMemo, JSX } from "solid-js"
import { Card } from "@kilocode/kilo-ui/card"
import { Button } from "@kilocode/kilo-ui/button"
import { Tag } from "@kilocode/kilo-ui/tag"
import { useVSCode } from "../../context/vscode"
import { useLanguage } from "../../context/language"
import type { MarketplaceItem, MarketplaceInstalledMetadata } from "../../types/marketplace"
import { installedScopes } from "./utils"

interface ItemCardProps {
  item: MarketplaceItem
  metadata: MarketplaceInstalledMetadata
  onInstall: (item: MarketplaceItem) => void
  onRemove: (item: MarketplaceItem, scope: "project" | "global") => void
  displayName?: string
  linkUrl?: string
  typeBadge?: string
  footer?: JSX.Element
}

export const ItemCard: Component<ItemCardProps> = (props) => {
  const vscode = useVSCode()
  const { t } = useLanguage()

  const scopes = createMemo(() => installedScopes(props.item.id, props.item.type, props.metadata))

  const name = () => props.displayName ?? props.item.name

  const openExternal = (url: string) => {
    vscode.postMessage({ type: "openExternal", url })
  }

  const scopeLabel = (scope: "project" | "global") =>
    scope === "project" ? t("marketplace.scope.project") : t("marketplace.scope.global")

  return (
    <Card class="marketplace-card">
      <div class="marketplace-card-header">
        <div>
          <Show when={props.linkUrl} fallback={<span class="marketplace-card-name">{name()}</span>}>
            <a
              class="marketplace-card-name link"
              href={props.linkUrl}
              onClick={(e) => {
                e.preventDefault()
                openExternal(props.linkUrl!)
              }}
            >
              {name()}
            </a>
          </Show>
          <span class="marketplace-card-author">
            {props.item.author && t("marketplace.card.by", { author: props.item.author })}
            <Show when={props.typeBadge}>
              <Tag size="normal" class="marketplace-card-type">
                {props.typeBadge}
              </Tag>
            </Show>
          </span>
        </div>
        <Show
          when={scopes().length > 0}
          fallback={
            <Button variant="primary" size="small" onClick={() => props.onInstall(props.item)}>
              {t("marketplace.install")}
            </Button>
          }
        >
          <div class="marketplace-remove-actions">
            <For each={scopes()}>
              {(scope) => (
                <Button variant="secondary" size="small" onClick={() => props.onRemove(props.item, scope)}>
                  {scopes().length > 1
                    ? t("marketplace.removeScope", { scope: scopeLabel(scope) })
                    : t("marketplace.remove")}
                </Button>
              )}
            </For>
          </div>
        </Show>
      </div>
      <p class="marketplace-card-description">{props.item.description}</p>
      <div class="marketplace-card-footer">
        <Show when={scopes().length > 0}>
          <Tag class="marketplace-badge-installed">{t("marketplace.installed")}</Tag>
        </Show>
        {props.footer}
      </div>
    </Card>
  )
}
