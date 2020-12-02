import React, { useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import './SoundEventsEditor.scss';
import { editorCache, onRequestResponse, request, useWindowEvent } from './utils';
import * as Icons from 'react-bootstrap-icons';
import styled from '@emotion/styled';
import { ListView } from './Components/ListView';
import { CacheProvider } from '@emotion/react';
import { css } from '@emotion/css';
import { ContextMenuType, ShowContextMenu } from './Components/ContextMenu';
import commonText from './common_i18n';
import { EditableText } from './Components/EditableText';
import { renderPositiveNumericState, TextInput } from './Components/TextInput';
import type { ISoundEventData } from '../../src/editors/sound_events_editor';
import { InputState } from './Components/utils';

const i18n: {
    [key: string]: {
        title: string;
        event: string;
        type: string;
        sounds: string;
        volume: string;
        pitch: string;
        other_kv: string;
        copy_event_name: string;
    };
} = {
    en: {
        title: 'LIST OF SOUND EVENT NAME',
        event: 'Sound Event',
        type: 'Sound Type',
        sounds: 'vsnd_files',
        volume: 'Volume',
        pitch: 'Pitch',
        other_kv: 'Other KV',
        copy_event_name: 'Copy Sound Event Name',
    },
    'zh-cn': {
        title: '音效事件名列表',
        event: '事件名',
        type: '音效类型',
        sounds: '音效文件(vsnd_files)',
        volume: '音量',
        pitch: '音高',
        other_kv: '其它KV',
        copy_event_name: '复制音效名称',
    },
};

const localText = i18n[navigator.language] || i18n['en'];

const keysSuggestion: { [key: string]: string[] } = {
    type: [
        'dota_update_default',
        'dota_limit_speakers_ui',
        'dota_src1_2d',
        'dota_src1_3d',
        'dota_src1_3d_footsteps',
        'dota_gamestart_horn',
        'dota_null_start',
        'dota_music_respawn',
        'dota_update_hero_select',
        'dota_update_killed',
        'dota_music_mainloop',
        'dota_statebattlemusic',
        'dota_battle',
        'dota_battleend',
        'dota_battlepicker',
        'dota_music_death_request',
        'dota_update_vo_switch',
    ],
    mixgroup: ['Weapons'],
};

function SoundEvent({
    soundData,
    index,
}: {
    index: number;
    soundData: ISoundEventData;
}) {
    return (
        <SoundCard>
            <div style={{ marginBottom: 0 }}>
                <EditableText
                    defaultValue={soundData['event']}
                    renderValue={(text) => text.replace(/\"/g, '')}
                    style={{
                        fontSize: 25,
                        borderBottom: '1px solid var(--vscode-panel-border)',
                    }}
                    onComplete={(text) => {
                        request('change-event-name', index, text);
                    }}
                />
            </div>
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'row',
                }}
            >
                <TextInput
                    key={'type' + soundData.type}
                    label={localText.type}
                    searchTexts={keysSuggestion['type']}
                    defaultValue={soundData.type}
                    onComplete={(text) => {
                        request('change-sound-key', index, 'type', text);
                    }}
                />
                <TextInput
                    key={'volume' + soundData.volume}
                    renderState={renderPositiveNumericState}
                    label={localText.volume}
                    defaultValue={soundData.volume}
                    onComplete={(text) => {
                        request('change-sound-key', index, 'volume', text);
                    }}
                />
                <TextInput
                    key={'pitch' + soundData.pitch}
                    renderState={renderPositiveNumericState}
                    label={localText.pitch}
                    defaultValue={soundData.pitch}
                    onComplete={(text) => {
                        request('change-sound-key', index, 'pitch', text);
                    }}
                />
            </div>
            <div>
                <ListView
                    title="Sound Files (*.vsnd)"
                    smallTitle
                    items={soundData.vsnd_files.map((v, i) => {
                        return {
                            key: i,
                            content: (
                                <EditableText
                                    key={v}
                                    noBorder
                                    defaultValue={v}
                                    renderState={(v) => {
                                        if (!v.endsWith('.vsnd')) {
                                            return InputState.Error;
                                        }
                                        return InputState.Normal;
                                    }}
                                    onComplete={(text) => {
                                        request('change-sound-file', index, i, text);
                                    }}
                                />
                            ),
                        };
                    })}
                    onSelected={() => {}}
                />
            </div>
        </SoundCard>
    );
}

const EditorView = styled.div`
    position: fixed;
    top: var(--base-gap);
    left: var(--base-gap);
    right: var(--base-gap);
    bottom: var(--base-gap);
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-rows: 1fr;
    gap: var(--base-gap);
    justify-content: stretch;
`;

const SoundsList = styled.div`
    display: flex;
    flex-direction: column;
    overflow-y: auto;
`;

const SoundCard = styled.div`
    display: flex;
    flex-direction: column;
    border: 1px solid var(--vscode-panel-border);
    flex-shrink: 0;
    user-select: none;
    border-radius: var(--panel-border-radius);
    /* background: var(--vscode-editorWidget-background); */
    padding: 20px;
    margin-bottom: var(--base-gap);
`;

function SoundEventsEditor() {
    let [soundEvents, setSoundEvents] = useState<ISoundEventData[]>([]);
    let [editableItems, setEditableItems] = useState<number[]>([]);

    useWindowEvent('message', (evt) => {
        if (evt.data.label === 'update') {
            setSoundEvents(JSON.parse(evt.data.text));
        } else {
            onRequestResponse(evt.data);
        }
    });

    /**
     * Copy Sound Event Name
     */
    function copySoundNames(keys: number[]) {
        const events = keys.map((k) =>
            String(soundEvents[k]['event']).replace(/\"/g, '')
        );
        navigator.clipboard.writeText(events.join('\n'));
    }

    return (
        <CacheProvider value={editorCache}>
            <EditorView>
                <ListView
                    title={localText.title}
                    items={soundEvents.map((v, i) => {
                        return {
                            key: i,
                            content: (
                                <div style={{ padding: 5 }}>
                                    {(v['event'] as string).replace(/\"/g, '')}
                                </div>
                            ),
                        };
                    })}
                    onSelected={(keys) => {
                        setEditableItems(keys);
                    }}
                    onKeyDown={(evt, keys, methods) => {
                        if (evt.ctrlKey) {
                            if (evt.altKey) {
                                if (evt.key === 'c') {
                                    copySoundNames(keys);
                                }
                            }
                            if (evt.key === 'a') {
                                methods.selectAll();
                            }
                        }
                    }}
                    onContextMenu={(event, keys, methods) => {
                        ShowContextMenu({
                            menu: [
                                {
                                    type: ContextMenuType.Normal,
                                    id: 'copy',
                                    text: commonText.copy,
                                    hotkey: 'Ctrl+C',
                                },
                                {
                                    type: ContextMenuType.Normal,
                                    id: 'copy_event_name',
                                    text: localText.copy_event_name,
                                    hotkey: 'Ctrl+Alt+C',
                                },
                                {
                                    type: ContextMenuType.Separator,
                                },
                                {
                                    type: ContextMenuType.Normal,
                                    id: 'select_all',
                                    text: commonText.select_all,
                                    hotkey: 'Ctrl+A',
                                },
                                {
                                    type: ContextMenuType.Normal,
                                    id: 'delete',
                                    text: commonText.delete,
                                    hotkey: 'Del',
                                },
                            ],
                            offset: {
                                top: event.clientY,
                                left: event.clientX,
                            },
                            onClick: (id) => {
                                switch (id) {
                                    case 'select_all':
                                        methods.selectAll();
                                        break;
                                    case 'copy_event_name':
                                        copySoundNames(keys);
                                        break;
                                }
                            },
                        });
                    }}
                />
                <SoundsList>
                    {editableItems.map((i) => {
                        return (
                            <SoundEvent
                                key={soundEvents[i].event + i}
                                index={i}
                                soundData={soundEvents[i]}
                            />
                        );
                    })}
                </SoundsList>
            </EditorView>
        </CacheProvider>
    );
}

const app = document.getElementById('app');
ReactDOM.render(<SoundEventsEditor />, app);
