# Update 1.0.1

**Release date:** YYYY-MM-DD

## Summary

A one-sentence summary of the release and its intent.

## Highlights

- Key highlight or `important` change users should know immediately.

## Added

- Add new feature or API (PR #123 by @username)
- Add tests or [documentation for feature X](https://www.statik.be)

## Changed

- Describe behavioral or API changes, migration notes if needed

## Fixed

- Fix bug where X caused Y (Issue #456)
- Fix edge-case handling for Z

## Deprecated

- Note deprecated features and recommended alternatives

## Removed

- Note removed features and any breaking changes

```html
<div class="">
  <span class="toggle-open js-toggle-collapsed-text">
    <span class="sr-only">Show changelog</span>
  </span>
  <span class="toggle-close js-toggle-expanded-text">
    <span class="sr-only">Hide changelog</span>
  </span>
</div>
```

```twig
{% if supplier.city|length %}
    {{ supplier.city }}{% if supplier.province|length %},{% endif %}
{% endif %}
{% if supplier.province|length %}
    {{ supplier.province.one().title }}
{% endif %}
```

# Manual intervention

> ⚠️ **ATTENTION**:  
> Not everything could be handled by the updater. You need to take some manual actions!
