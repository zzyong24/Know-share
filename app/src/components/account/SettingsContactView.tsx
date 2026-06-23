"use client";

import { DisclosurePolicyCallout } from "./DisclosurePolicyCallout";
import { ContactMethodsForm } from "./ContactMethodsForm";
import { ConsentRecordList } from "./ConsentRecordList";
import { SettingsSubNav } from "./SettingsSubNav";
import { notify } from "@/components/shared";
import {
  useContactMethods,
  useSaveContactMethods,
  useConsents,
  useRevokeConsent,
} from "@/lib/queries/account";

/*
  SettingsContactView —— PAGE-063 设置·联系方式（核心隐私面）。
  披露策略 Callout + 联系方式表单（默认私密 INV-03）+ 同意/披露记录（可撤回 ASM-013）。
*/
export function SettingsContactView() {
  const contacts = useContactMethods();
  const saveContacts = useSaveContactMethods();
  const consents = useConsents("disclosure");
  const revoke = useRevokeConsent();

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-4 py-6 md:flex-row">
      <aside className="md:w-64 md:shrink-0">
        <SettingsSubNav activeKey="contact" />
      </aside>

      <section className="flex max-w-[800px] flex-1 flex-col gap-6">
        <DisclosurePolicyCallout />

        <ContactMethodsForm
          contactMethods={contacts.data?.items ?? []}
          loading={contacts.isLoading}
          saving={saveContacts.isPending}
          onSave={async (methods) => {
            await saveContacts.mutateAsync(methods);
          }}
          onCancel={() => notify("已放弃未保存改动。", "info")}
        />

        <div>
          <h2 className="mb-3 text-base font-semibold text-text">同意记录</h2>
          <ConsentRecordList
            records={consents.data?.items ?? []}
            loading={consents.isLoading}
            error={consents.isError}
            mode="disclosure"
            onRetry={() => consents.refetch()}
            onRevoke={(id) =>
              revoke.mutate(id, {
                onSuccess: () => {
                  notify("已撤回（仅未来生效）。", "success");
                  consents.refetch();
                },
              })
            }
          />
        </div>
      </section>
    </div>
  );
}
