/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { defineAsyncComponent, Ref, ShallowRef } from 'vue';
import * as Misskey from 'misskey-js';
import { claimAchievement } from './achievements.js';
import { $i } from '@/account.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { url } from '@@/js/config.js';
import { defaultStore, noteActions } from '@/store.js';
import { miLocalStorage } from '@/local-storage.js';
import { getUserMenu } from '@/scripts/get-user-menu.js';
import { clipsCache } from '@/cache.js'; // favoritedChannelsCache を削除
import type { MenuItem } from '@/types/menu.js';
import MkRippleEffect from '@/components/MkRippleEffect.vue';
import { isSupportShare } from '@/scripts/navigator.js';
import { getAppearNote } from '@/scripts/get-appear-note.js';
import { genEmbedCode } from '@/scripts/get-embed-code.js';

// ... (getNoteClipMenu, getAbuseNoteMenu, getCopyNoteLinkMenu, getNoteEmbedCodeMenu は変更なし)

export function getNoteMenu(props: {
    note: Misskey.entities.Note;
    translation: Ref<Misskey.entities.NotesTranslateResponse | null>;
    translating: Ref<boolean>;
    isDeleted: Ref<boolean>;
    currentClip?: Misskey.entities.Clip;
}) {
    // ... (内部の関数 del, delEdit, toggleFavorite, toggleThreadMute, copyContent, copyLink, togglePin, unclip, promote, share, openDetail, translate は変更なし)

    const menuItems: MenuItem[] = [];

    if ($i) {
        const statePromise = misskeyApi('notes/state', {
            noteId: appearNote.id,
        });

        // ... (クリップ関連の処理は変更なし)

        // ... (詳細、コピー関連、外部サイト表示、埋め込みコード、共有、翻訳の処理は変更なし)

        menuItems.push({ type: 'divider' });

        // ... (お気に入り、クリップ、スレッドミュートの処理は変更なし)

        // ... (ピン留めの処理は変更なし)

        menuItems.push({
            type: 'parent',
            icon: 'ti ti-user',
            text: i18n.ts.user,
            children: async () => {
                const user = appearNote.userId === $i?.id ? $i : await misskeyApi('users/show', { userId: appearNote.userId });
                const { menu, cleanup } = getUserMenu(user);
                cleanups.push(cleanup);
                return menu;
            },
        });

        if (appearNote.userId !== $i.id) {
            menuItems.push({ type: 'divider' });
            menuItems.push(getAbuseNoteMenu(appearNote, i18n.ts.reportAbuse));
        }

        // チャンネル関連の処理を削除！
        // if (appearNote.channel && (appearNote.channel.userId === $i.id || $i.isModerator || $i.isAdmin)) {
        //     // ...
        // }

        // ... (編集、削除の処理は変更なし)
    } else {
        // ... (ログインしていない場合の処理は変更なし)
    }

    // ... (noteActions, devMode, cleanup の処理は変更なし)

    return {
        menu: menuItems,
        cleanup,
    };
}

// ... (smallerVisibility は変更なし)

export function getRenoteMenu(props: {
    note: Misskey.entities.Note;
    renoteButton: ShallowRef<HTMLElement | undefined>;
    mock?: boolean;
}) {
    const appearNote = getAppearNote(props.note);

    // チャンネル関連の処理を完全に削除！
    const normalRenoteItems: MenuItem[] = [];

    normalRenoteItems.push(...[{
        text: i18n.ts.renote,
        icon: 'ti ti-repeat',
        action: () => {
            // ... (リノートのアニメーション処理は変更なし)

            const configuredVisibility = defaultStore.state.rememberNoteVisibility ? defaultStore.state.visibility : defaultStore.state.defaultNoteVisibility;
            const localOnly = defaultStore.state.rememberNoteVisibility ? defaultStore.state.localOnly : defaultStore.state.defaultNoteLocalOnly;

            let visibility = appearNote.visibility;
            visibility = smallerVisibility(visibility, configuredVisibility);
            // チャンネルがなくなったのでこの条件も削除
            // if (appearNote.channel?.isSensitive) {
            //     visibility = smallerVisibility(visibility, 'home');
            // }

            if (!props.mock) {
                misskeyApi('notes/create', {
                    localOnly,
                    visibility,
                    renoteId: appearNote.id,
                }).then(() => {
                    os.toast(i18n.ts.renoted);
                });
            }
        },
    }, (props.mock) ? undefined : {
        text: i18n.ts.quote,
        icon: 'ti ti-quote',
        action: () => {
            os.post({
                renote: appearNote,
            });
        },
    }]);

    const renoteItems = [
        ...normalRenoteItems,
        ...(normalRenoteItems.length ? [{ type: 'divider' }] : []),
    ] as MenuItem[];

    return {
        menu: renoteItems,
    };
}