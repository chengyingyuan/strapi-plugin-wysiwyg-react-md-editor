import React, {useState, useEffect} from "react";
import PropTypes from "prop-types";
import { useIntl } from 'react-intl';
import { stringify } from 'qs';
import {
    ModalLayout,
    ModalBody,
    ModalHeader,
    ModalFooter,
    Button,
    Flex,
    Box,
    Divider,
    Typography,
    Tabs,
    Tab,
    TabGroup,
    TabPanels,
    TabPanel,
    Badge,
    SingleSelect, SingleSelectOption,
    TextInput,
    RadioGroup, Radio,
    Table, Thead, Tbody, Tr, Td, Th,
  } from '@strapi/design-system';

import { useFetchClient } from '@strapi/helper-plugin';

import pluginId from '../../pluginId';
const getTrad = (id) => `${pluginId}.${id}`;

const ContentTypesView = ({contentTypes, contentType, onChange}) => {
  if (contentTypes == null) {
    return (<Box><Typography>Loading...</Typography></Box>)
  } else if (contentTypes.length == 0) {
    return (<Box><Typography>No content types</Typography></Box>)
  } else {
    const value = contentType ? contentType.uid:'';
    return (
      <Box>
        <SingleSelect label="Content types" required placeholder="Please select content types" 
          onClear={() => { onChange(null) }} value={value} onChange={(v) => { 
            onChange(contentTypes.find(c => c.uid == v))}}>
          {
            contentTypes.map((v,i) => {
              return (<SingleSelectOption key={`k${i}`} value={v.uid}>{v.info.displayName}</SingleSelectOption>)
            })
          }
        </SingleSelect>
      </Box>)    
  }
}

const ContentFilterView = ({contentType, filterAttribute, filterValue, onChangeAttribute, onChangeValue}) => {
  if (contentType === null) {
    return null;
  }
  const attributes = contentType.attributes
  const keys = Object.keys(attributes).map(k => ({...attributes[k], key:k})).filter(v => v.type=='string' || v.type=='richtext')
  return (
    <Box>
      <SingleSelect label="Filter key" required placeholder="Please select key" 
        onClear={() => { onChangeAttribute(null) }} value={filterAttribute ? filterAttribute:''} onChange={onChangeAttribute}>
        {
          keys.map((v,i) => {
            return (<SingleSelectOption key={`k${i}`} value={v.key}>{v.key}</SingleSelectOption>)
          })
        }
      </SingleSelect>
      <TextInput placeholder="Input text to filter" label="Filter value" 
        onChange={e => onChangeValue(e.target.value)} value={filterValue}/>
    </Box>)
}

const ContentsView = ({contents, content, filterAttribute, onChange}) => {
  if (contents == null) {
    return null;
  }
  console.log('Contents:', contents)
  return (
    <RadioGroup onChange={e => onChange(contents.find(v => v.id==e.target.value))} value={content ? content.id:''}>
      {
        contents.map((v,i) => {
          return (<Radio key={`k${i}`} value={v.id}>{v[filterAttribute]}</Radio>)
        })
      }
    </RadioGroup>    
  )
}

const ContentView = ({content}) => {
  if (content == null) {
    return null;
  }
  const items = Object.keys(content).map(k => ({key:k, value:content[k]}))
  return (<Table>
    <Tbody>
      {
        items.map((v, i) => {
          return (<Tr key={`k${i}`}>
            <Td>{v.key}</Td>
            <Td>{v.value ? JSON.stringify(v.value):''}</Td>
          </Tr>)
        })
      }
    </Tbody>
  </Table>)
}

const IntraReferDialog = ({ isOpen, onChange, onToggle }) => {
  const { formatMessage } = useIntl();
  const [contentTypes, setContentTypes] = useState(null);
  const [contentType, setContentType] = useState(null);
  const [contents, setContents] = useState(null);
  const [content, setContent] = useState(null);
  const [filterAttribute, setFilterAttribute] = useState(null);
  const [filterValue, setFilterValue] = useState(null);
  const [pagination, setPagination] = useState(null)
  const [initialSelectedTabIndex, setInitialSelectedTabIndex] = useState(0);
  const { get } = useFetchClient();

  const queryServer = async (uri, params) => {
    params = {
      pagination: {
        pageSize: -1,
      },
      ...params,
    }
    try {
      const url = `${uri}?${stringify(params, { encode: false })}`
      const { data } = await get(url);
      console.log(`Request ${url}:`, data)
      return data;
    } catch(err) {
      console.error(`Error query $uri`, err);
      throw err;
    }
  }

  const updateState = (types, type=null, attrib=null, value='', contents=null, pagination=null, content=null) => {
    setContentTypes(types)
    setContentType(type)
    setFilterAttribute(attrib)
    setFilterValue(value)
    setContents(contents)
    setPagination(pagination)
    setContent(content)
  }

  const onUpdateTypes = (types) => updateState(types)
  const onUpdateType = (type) => updateState(contentTypes, type)
  const onUpdateAttribute = (attrib) => updateState(contentTypes, contentType, attrib)
  const onUpdateValue = (value) => updateState(contentTypes, contentType, filterAttribute, value)
  const onUpdateContents = (contents, pagination) => updateState(contentTypes, contentType, filterAttribute, filterValue, contents, pagination)
  const onUpdateContent = (content) => updateState(contentTypes, contentType, filterAttribute, filterValue, contents, pagination, content)

  const queryContentTypes = async () => {
    const uri = '/content-manager/content-types'
    const params = {filters: {uid:{$startsWith:'api::'}}}
    const {data,} = await queryServer(uri, params)
    let results = []
    if (data) {
      for (const t of data) {
        if (t.uid && t.uid.startsWith('api::')) {
          results.push(t)
        }
      }
    }
    onUpdateTypes(results)
  };

  const queryContents = async () => {
    const {uid} = contentType
    const uri = `/content-manager/collection-types/${uid}`
    const params = {filters: {[filterAttribute]:{$containsi:filterValue}}}
    const {results, pagination:page} = await queryServer(uri, params)
    if (!results) {
      results = []
    }
    onUpdateContents(results, page)
  }

  useEffect(() => {
    if (contentTypes == null) {
        queryContentTypes();
    } else if (contents == null && contentType && filterAttribute) {
        queryContents();
    }
  });

  if (!isOpen) return null;

  return (
    <ModalLayout onClose={onToggle} labelledBy="asset-dialog-title" aria-busy>
      <ModalHeader>
        <Typography fontWeight="bold">
          {formatMessage({
            id: getTrad('header.actions.select-content'),
            defaultMessage: 'Select content',
          })}
        </Typography>
      </ModalHeader>

      <TabGroup
        label={formatMessage({
          id: getTrad('tabs.title'),
          defaultMessage: 'How do you want to choose your content?',
        })}
        variant="simple"
        initialSelectedTabIndex={initialSelectedTabIndex}
        onTabChange={() => setInitialSelectedTabIndex(0)}
      >
        <Flex paddingLeft={8} paddingRight={8} paddingTop={6} justifyContent="space-between">
          <Tabs>
            <Tab>
              {formatMessage({
                id: getTrad('modal.nav.find-contents'),
                defaultMessage: 'Find contents',
              })}
            </Tab>
            <Tab>
              {formatMessage({
                id: getTrad('modal.nav.selected-content'),
                defaultMessage: 'Selected content',
              })}
              <Badge marginLeft={2}>{content ? 1:0}</Badge>
            </Tab>
          </Tabs>          
        </Flex>
        <Divider />
        <TabPanels>
          <TabPanel>
            <ModalBody>
              <ContentTypesView contentTypes={contentTypes} contentType={contentType} onChange={(v) => onUpdateType(v)}/>
              <ContentFilterView contentType={contentType} filterAttribute={filterAttribute} filterValue={filterValue}
                onChangeAttribute={(v) => onUpdateAttribute(v)}
                onChangeValue={(v) => onUpdateValue(v)}
                />
              <ContentsView contents={contents} content={content} filterAttribute={filterAttribute} 
                onChange={(v) => onUpdateContent(v)}/>
            </ModalBody>
          </TabPanel>
          <TabPanel>
            <ModalBody>
              <ContentView content={content}/>
            </ModalBody>                  
          </TabPanel>
        </TabPanels>
      </TabGroup>
      <ModalFooter
      startActions={
        <Button onClick={onToggle} variant="tertiary">
          {formatMessage({ id: 'app.components.Button.cancel', defaultMessage: 'Cancel' })}
        </Button>
      }
      endActions={
        onChange && (
            <Button onClick={() => onChange(contentType, content) }>
              {formatMessage({ id: 'global.finish', defaultMessage: 'Finish' })}
            </Button>
          )
        }
      />
    </ModalLayout>
  );
};

IntraReferDialog.defaultProps = {
  isOpen: false,
  onChange: (type, content) => {},
  onToggle: () => {},
};

IntraReferDialog.propTypes = {
  isOpen: PropTypes.bool,
  onChange: PropTypes.func,
  onToggle: PropTypes.func,
};

export default IntraReferDialog;
