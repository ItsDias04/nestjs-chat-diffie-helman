#!/usr/bin/env python3
"""
nativescript_component_generator.py

Простой генератор компонентов для NativeScript + Angular
Создаёт компонентные файлы (TS, HTML, CSS) в директории с именем компонента.
Опционально создаёт модуль и routing-модуль (как в примере SearchModule/SearchRoutingModule).
Поддерживает генерацию "простых" компонентов (без собственного роутинга/модуля).

Пример использования:
  python nativescript_component_generator.py Search --routing
  python nativescript_component_generator.py Profile --simple
  python nativescript_component_generator.py card list-of-items --force

Файлы, которые создаются при --routing (например для Search):
  search/search.component.ts
  search/search.component.html
  search/search.component.css
  search/search-routing.module.ts
  search/search.module.ts

При --simple (по умолчанию, если не указано --routing):
  card/card.component.ts
  card/card.component.html
  card/card.component.css

Опции:
  --routing    Создавать module + routing module
  --simple     Принудительно простая генерация (без module + routing)
  --force      Перезаписывать существующие файлы
  --selector   Явно указать selector для @Component (по-умолчанию PascalCase)
  --prefix     Префикс для селектора (например: app-)

Автор: автогенерация для пользователя
"""

from pathlib import Path
import argparse
import sys
import re


def to_kebab(name: str) -> str:
    # Search -> search, MyComponent -> my-component
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1-\2', name)
    kebab = re.sub('([a-z0-9])([A-Z])', r'\1-\2', s1).lower()
    return kebab


def to_pascal(name: str) -> str:
    parts = re.split('[\s_-]+', name)
    return ''.join(p.capitalize() for p in parts if p)


def to_camel(name: str) -> str:
    pascal = to_pascal(name)
    return pascal[0].lower() + pascal[1:] if pascal else pascal


def ensure_dir(path: Path):
    if not path.exists():
        path.mkdir(parents=True, exist_ok=True)


COMPONENT_TS_TEMPLATE = '''import {{ Component, OnInit, NO_ERRORS_SCHEMA }} from '@angular/core'
import {{ RadSideDrawer }} from 'nativescript-ui-sidedrawer'
import {{ Application }} from '@nativescript/core'

@Component({
  selector: '{selector}',
  templateUrl: './{kebab}.component.html',
  styleUrls: ['./{kebab}.component.css'],
})
export class {pascal}Component implements OnInit {{
  {search_term_decl}
  constructor() {{
    // Use the component constructor to inject providers.
  }}

  ngOnInit(): void {{
    // Init your component properties here.
  }}

  onDrawerButtonTap(): void {{
    const sideDrawer = <RadSideDrawer>Application.getRootView()
    sideDrawer.showDrawer()
  }}

  search(text: any): void {{
    console.log("hello word: "+text)
  }}
}}
'''

COMPONENT_HTML_TEMPLATE = '''<ActionBar class="action-bar">
  <NavigationButton visibility="hidden"></NavigationButton>
  <GridLayout columns="50, *">
    <Label class="action-bar-title" text="{title}" colSpan="2"></Label>

    <Label class="fas" text="&#xf0c9;" (tap)="onDrawerButtonTap()"></Label>
  </GridLayout>
</ActionBar>

<GridLayout class="page__content" rows="auto, *">
  <TextField class="search-component" (textChange)="search($event)" hint="{title}" [(ngModel)]="{search_term}" maxlength="20"/>
</GridLayout>
'''

COMPONENT_CSS_TEMPLATE = '''/* Basic styles for {title} component */
.action-bar {{
  padding: 12px;
}}
.page__content {{
  padding: 16px;
}}
.search-component {{
  height: 44px;
  border-radius: 6px;
  padding: 8px;
}}
'''

MODULE_TS_TEMPLATE = '''import {{ NgModule, NO_ERRORS_SCHEMA }} from '@angular/core'
import {{ NativeScriptCommonModule }} from '@nativescript/angular'

import {{ {pascal}RoutingModule }} from './{kebab}-routing.module'
import {{ {pascal}Component }} from './{kebab}.component'

@NgModule({{
  imports: [NativeScriptCommonModule, {pascal}RoutingModule],
  declarations: [{pascal}Component],
  schemas: [NO_ERRORS_SCHEMA],
}})
export class {pascal}Module {{}}
'''

ROUTING_TS_TEMPLATE = '''import {{ NgModule }} from '@angular/core'
import {{ Routes }} from '@angular/router'
import {{ NativeScriptRouterModule }} from '@nativescript/angular'

import {{ {pascal}Component }} from './{kebab}.component'

const routes: Routes = [{{ path: '', component: {pascal}Component }}]

@NgModule({{
  imports: [NativeScriptRouterModule.forChild(routes)],
  exports: [NativeScriptRouterModule],
}})
export class {pascal}RoutingModule {{}}
'''

SIMPLE_COMPONENT_TS_TEMPLATE = '''import {{ Component, OnInit }} from '@angular/core'

@Component({
  selector: '{selector}',
  templateUrl: './{kebab}.component.html',
  styleUrls: ['./{kebab}.component.css'],
})
export class {pascal}Component implements OnInit {{
  constructor() {{}}
  ngOnInit(): void {{}}
}}
'''

BARREL_EXPORT = "export * from './{kebab}.component';\n"


def write_file(path: Path, content: str, force: bool = False):
    if path.exists() and not force:
        print(f"[skip] {path} already exists (use --force to overwrite)")
        return False
    path.write_text(content, encoding='utf-8')
    print(f"[write] {path}")
    return True


def generate_component(base_dir: Path, raw_name: str, routing: bool, simple: bool, selector: str | None, prefix: str, force: bool):
    pascal = to_pascal(raw_name)
    kebab = to_kebab(raw_name)
    dir_path = base_dir / kebab
    ensure_dir(dir_path)

    sel = selector if selector else (prefix + kebab if prefix else pascal)

    # choose template: if simple generate minimal component
    if simple and not routing:
        ts = SIMPLE_COMPONENT_TS_TEMPLATE.format(selector=sel, kebab=kebab, pascal=pascal)
    else:
        ts = COMPONENT_TS_TEMPLATE.format(selector=sel, kebab=kebab, pascal=pascal, search_term_decl=f"searchTerm: string" )

    html = COMPONENT_HTML_TEMPLATE.format(title=pascal, search_term='searchTerm')
    css = COMPONENT_CSS_TEMPLATE.format(title=pascal)

    # write files
    write_file(dir_path / f"{kebab}.component.ts", ts, force)
    write_file(dir_path / f"{kebab}.component.html", html, force)
    write_file(dir_path / f"{kebab}.component.css", css, force)

    # create module + routing if requested
    if routing and not simple:
        routing_ts = ROUTING_TS_TEMPLATE.format(pascal=pascal, kebab=kebab)
        module_ts = MODULE_TS_TEMPLATE.format(pascal=pascal, kebab=kebab)
        write_file(dir_path / f"{kebab}-routing.module.ts", routing_ts, force)
        write_file(dir_path / f"{kebab}.module.ts", module_ts, force)

    # add barrel file (optional)
    barrel_path = dir_path / 'index.ts'
    if not barrel_path.exists() or force:
        barrel_path.write_text(BARREL_EXPORT.format(kebab=kebab), encoding='utf-8')
        print(f"[write] {barrel_path}")


def main(argv=None):
    parser = argparse.ArgumentParser(description='Generate NativeScript-Angular components')
    parser.add_argument('names', nargs='+', help='Component names (Search or search or my-card)')
    parser.add_argument('--routing', action='store_true', help='Generate module + routing module for each component')
    parser.add_argument('--simple', action='store_true', help='Generate a simple component (no module/routing)')
    parser.add_argument('--force', action='store_true', help='Overwrite existing files')
    parser.add_argument('--selector', type=str, help='Explicit selector for @Component')
    parser.add_argument('--prefix', type=str, default='', help='Selector prefix (eg: app-)')
    parser.add_argument('--out', type=str, default='.', help='Output base directory')

    args = parser.parse_args(argv)

    base_dir = Path(args.out).resolve()
    for raw in args.names:
        generate_component(base_dir, raw, args.routing, args.simple, args.selector, args.prefix, args.force)


if __name__ == '__main__':
    main()
