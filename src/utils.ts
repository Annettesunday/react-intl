/*
HTML escaping is the same as React's
(on purpose.) Therefore, it has the following Copyright and Licensing:

Copyright 2013-2014, Facebook, Inc.
All rights reserved.

This source code is licensed under the BSD-style license found in the LICENSE
file in the root directory of React's source tree.
*/

import {IntlConfig, IntlCache, CustomFormats, Formatters} from './types';
import * as React from 'react';
import IntlMessageFormat from 'intl-messageformat';
import memoizeIntlConstructor from 'intl-format-cache';
// Since rollup cannot deal with namespace being a function,
// this is to interop with TypeScript since `invariant`
// does not export a default
// https://github.com/rollup/rollup/issues/1267
import * as invariant_ from 'invariant';
import {IntlRelativeTimeFormatOptions} from '@formatjs/intl-relativetimeformat';
const invariant: typeof invariant_ = (invariant_ as any).default || invariant_;

const ESCAPED_CHARS: Record<number, string> = {
  38: '&amp;',
  62: '&gt;',
  60: '&lt;',
  34: '&quot;',
  39: '&#x27;',
};

const UNSAFE_CHARS_REGEX = /[&><"']/g;

export function escape(str: string): string {
  return ('' + str).replace(
    UNSAFE_CHARS_REGEX,
    match => ESCAPED_CHARS[match.charCodeAt(0)]
  );
}

export function filterProps<T extends Record<string, any>, K extends string>(
  props: T,
  whitelist: Array<K>,
  defaults: Partial<T> = {}
): Pick<T, K> {
  return whitelist.reduce((filtered, name) => {
    if (name in props) {
      filtered[name] = props[name];
    } else if (name in defaults) {
      filtered[name] = defaults[name]!;
    }

    return filtered;
  }, {} as Pick<T, K>);
}

export function invariantIntlContext(intl?: any): void {
  invariant(
    intl,
    '[React Intl] Could not find required `intl` object. ' +
      '<IntlProvider> needs to exist in the component ancestry.'
  );
}

export function createError(message: string, exception?: Error): string {
  const eMsg = exception ? `\n${exception.stack}` : '';
  return `[React Intl] ${message}${eMsg}`;
}

export function defaultErrorHandler(error: string): void {
  if (process.env.NODE_ENV !== 'production') {
    console.error(error);
  }
}

export const DEFAULT_INTL_CONFIG: Pick<
  IntlConfig,
  | 'formats'
  | 'messages'
  | 'timeZone'
  | 'textComponent'
  | 'defaultLocale'
  | 'defaultFormats'
  | 'onError'
> = {
  formats: {},
  messages: {},
  timeZone: undefined,
  textComponent: React.Fragment,

  defaultLocale: 'en',
  defaultFormats: {},

  onError: defaultErrorHandler,
};

export function createIntlCache(): IntlCache {
  return {
    dateTime: {},
    number: {},
    message: {},
    relativeTime: {},
    pluralRules: {},
    list: {},
  };
}

/**
 * Create intl formatters and populate cache
 * @param cache explicit cache to prevent leaking memory
 */
export function createFormatters(
  cache: IntlCache = createIntlCache()
): Formatters {
  const RelativeTimeFormat = (Intl as any).RelativeTimeFormat;
  const ListFormat = (Intl as any).ListFormat;
  return {
    getDateTimeFormat: memoizeIntlConstructor(
      Intl.DateTimeFormat,
      cache.dateTime
    ),
    getNumberFormat: memoizeIntlConstructor(Intl.NumberFormat, cache.number),
    getMessageFormat: memoizeIntlConstructor(IntlMessageFormat, cache.message),
    getRelativeTimeFormat: memoizeIntlConstructor(
      RelativeTimeFormat,
      cache.relativeTime
    ),
    getPluralRules: memoizeIntlConstructor(Intl.PluralRules, cache.pluralRules),
    getListFormat: memoizeIntlConstructor(ListFormat, cache.list),
  };
}

export function getNamedFormat<T extends keyof CustomFormats>(
  formats: CustomFormats,
  type: T,
  name: string,
  onError: (err: string) => void
):
  | Intl.NumberFormatOptions
  | Intl.DateTimeFormatOptions
  | IntlRelativeTimeFormatOptions
  | undefined {
  const formatType = formats && formats[type];
  let format;
  if (formatType) {
    format = formatType[name];
  }
  if (format) {
    return format;
  }

  onError(createError(`No ${type} format named: ${name}`));
}
