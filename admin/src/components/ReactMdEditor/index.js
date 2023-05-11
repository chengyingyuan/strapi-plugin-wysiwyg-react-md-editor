import React, { useState } from "react";
import PropTypes from "prop-types";
import MDEditor, { commands } from "@uiw/react-md-editor";
import { getCodeString } from 'rehype-rewrite';
import katex from 'katex';
import 'katex/dist/katex.css';
import MediaLib from "../MediaLib";
import IntraReferDialog from "../IntraReferDialog";
import styled from "styled-components";
import "@uiw/react-markdown-preview/dist/markdown.css";
import "@uiw/react-md-editor/dist/mdeditor.min.css";
import { Stack } from "@strapi/design-system/Stack";
import { Box } from "@strapi/design-system/Box";
import { Typography } from "@strapi/design-system/Typography";
import { useIntl } from "react-intl";
import { Icon, } from '@strapi/design-system';
import { ExternalLink } from '@strapi/icons';

  // @strapi/icons/
// https://design-system-git-main-strapijs.vercel.app/?path=/docs/design-system-components-theme--icons


const Wrapper = styled.div`
  > div:nth-child(2) {
    display: none;
  }
  .w-md-editor-bar {
    display: none;
  }
  .w-md-editor {
    border: 1px solid #dcdce4;
    border-radius: 4px;
    box-shadow: none;
    &:focus-within {
      border: 1px solid #4945ff;
      box-shadow: #4945ff 0px 0px 0px 2px;
    }
    min-height: 400px;
    display: flex;
    flex-direction: column;
    img {
      max-width: 100%;
    }
    .w-md-editor-preview {
      display: block;
      strong {
        font-weight: bold;
      }
      em {
        font-style: italic;
      }
    }
  }
  .w-md-editor-content {
    flex: 1 1 auto;
  }
  .w-md-editor-fullscreen {
    z-index: 3;
  }
  .w-md-editor-text {
    margin: 0;
  }
  .w-md-editor-preview ol {
    list-style: auto;
  }
`;

const Editor = ({
  name,
  onChange,
  value,
  intlLabel,
  disabled,
  error,
  description,
  required,
}) => {
  const { formatMessage } = useIntl();
  const [mediaLibVisible, setMediaLibVisible] = useState(false);
  const [mediaLibSelection, setMediaLibSelection] = useState(-1);
  const [intraReferVisible, setIntraReferVisible] = useState(false);

  const handleToggleMediaLib = () => setMediaLibVisible((prev) => !prev);

  const handleChangeAssets = (assets) => {
    let newValue = value ? value : "";
    assets.map((asset) => {
      if (asset.mime.includes("image")) {
        const imgTag = ` ![](${asset.url}) `;
        if (mediaLibSelection > -1) {
          newValue =
            value.substring(0, mediaLibSelection) +
            imgTag +
            value.substring(mediaLibSelection);
        } else {
          newValue = `${newValue}${imgTag}`;
        }
      }
      // Handle videos and other type of files by adding some code
    });
    onChange({ target: { name, value: newValue || "" } });
    handleToggleMediaLib();
  };

  const handleToggleIntraRefer = () => setIntraReferVisible((prev) => !prev);

  const handleChangeIntraRefer = (type, content) => {
    let newValue = value ? value : "";
    const uri = `/iref/${type.uid}/${content.id}`
    const linkTag = `[[iref]](${uri})`
    if (mediaLibSelection > -1) {
      newValue =
        value.substring(0, mediaLibSelection) +
        linkTag +
        value.substring(mediaLibSelection);
    } else {
      newValue = `${newValue}${linkTag}`;
    }
    onChange({ target: { name, value: newValue || "" } });
    handleToggleIntraRefer()    
  }

  return (
    <Stack size={1}>
      <Box>
        <Typography variant="pi" fontWeight="bold">
          {formatMessage(intlLabel)}
        </Typography>
        {required && (
          <Typography variant="pi" fontWeight="bold" textColor="danger600">
            *
          </Typography>
        )}
      </Box>
      <Wrapper>
        <MDEditor
          disabled={disabled}
          commands={[
            commands.title2,
            commands.title3,
            commands.title4,
            commands.title5,
            commands.title6,
            commands.divider,
            commands.bold,
            commands.codeBlock,
            commands.italic,
            commands.strikethrough,
            commands.hr,
            commands.group,
            commands.divider,
            commands.link,
            commands.quote,
            commands.code,
            {
              name: "image",
              keyCommand: "image",
              buttonProps: { "aria-label": "Insert title3" },
              icon: (
                <svg width="12" height="12" viewBox="0 0 20 20">
                  <path
                    fill="currentColor"
                    d="M15 9c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm4-7H1c-.55 0-1 .45-1 1v14c0 .55.45 1 1 1h18c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1zm-1 13l-6-5-2 2-4-5-4 8V4h16v11z"
                  ></path>
                </svg>
              ),
              execute: (state, api) => {
                setMediaLibSelection(state.selection.end);
                handleToggleMediaLib();
              },
            },
            {
              name: "iref",
              keyCommand: "iref",
              buttonProps: { "aria-label": "Insert title3" },
              icon: (
                <Icon as={ExternalLink} width={'12px'} height={'12px'} />
              ),
              execute: (state, api) => {
                setMediaLibSelection(state.selection.end);
                handleToggleIntraRefer();
              },
            },
            commands.unorderedListCommand,
            commands.orderedListCommand,
            commands.checkedListCommand,
          ]}
          value={value || ""}
          onChange={(newValue) => {
            onChange({ target: { name, value: newValue || "" } });
          }}
          previewOptions={{
            components: {
              code: ({ inline, children = [], className, ...props }) => {
                const txt = children[0] || '';
                if (inline) {
                  if (typeof txt === 'string' && /^\$\$(.*)\$\$/.test(txt)) {
                    const html = katex.renderToString(txt.replace(/^\$\$(.*)\$\$/, '$1'), {
                      throwOnError: false,
                    });
                    return <code dangerouslySetInnerHTML={{ __html: html }} />;
                  }
                  return <code>{txt}</code>;
                }
                const code = props.node && props.node.children ? getCodeString(props.node.children) : txt;
                if (
                  typeof code === 'string' &&
                  typeof className === 'string' &&
                  /^language-katex/.test(className.toLocaleLowerCase())
                ) {
                  const html = katex.renderToString(code, {
                    throwOnError: false,
                  });
                  return <code style={{ fontSize: '150%' }} dangerouslySetInnerHTML={{ __html: html }} />;
                }
                return <code className={String(className)}>{code}</code>;
              },
            },
          }}          
        />
        <div style={{ padding: "50px 0 0 0" }} />
        <MediaLib
          isOpen={mediaLibVisible}
          onChange={handleChangeAssets}
          onToggle={handleToggleMediaLib}
        />
        <IntraReferDialog
          isOpen={intraReferVisible}
          onChange={handleChangeIntraRefer}
          onToggle={handleToggleIntraRefer}
        />
      </Wrapper>
      {error && (
        <Typography variant="pi" textColor="danger600">
          {formatMessage({ id: error, defaultMessage: error })}
        </Typography>
      )}
      {description && (
        <Typography variant="pi">{formatMessage(description)}</Typography>
      )}
    </Stack>
  );
};

Editor.propTypes = {
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default Editor;
