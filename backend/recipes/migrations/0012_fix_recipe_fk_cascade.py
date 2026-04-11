# Generated manually: Neon DB had FKs without ON DELETE CASCADE despite models.

from django.db import migrations


# Tables with recipe_id -> recipes_recipe(id); constraint names are deterministic for ADD.
_RECIPE_CHILD_TABLES = (
    ('recipes_recipeingredient', 'recipes_recipeingredient_recipe_id_fk'),
    ('recipes_recipeinstruction', 'recipes_recipeinstruction_recipe_id_fk'),
    ('recipes_recipeimage', 'recipes_recipeimage_recipe_id_fk'),
    ('recipes_like', 'recipes_like_recipe_id_fk'),
    ('recipes_collectionrecipe', 'recipes_collectionrecipe_recipe_id_fk'),
    ('recipes_recipe_tags', 'recipes_recipe_tags_recipe_id_fk'),
)


def _drop_recipe_id_fks(cursor, table_name: str) -> None:
    cursor.execute(
        """
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON tc.table_schema = kcu.table_schema
          AND tc.table_name = kcu.table_name
          AND tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = %s
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'recipe_id'
        """,
        [table_name],
    )
    for (constraint_name,) in cursor.fetchall():
        cursor.execute(
            'ALTER TABLE "%s" DROP CONSTRAINT "%s"' % (table_name, constraint_name)
        )


def _ensure_cascade_fks(apps, schema_editor) -> None:
    if schema_editor.connection.vendor != 'postgresql':
        return
    with schema_editor.connection.cursor() as cursor:
        for table_name, new_conname in _RECIPE_CHILD_TABLES:
            cursor.execute(
                """
                SELECT 1 FROM pg_class c
                JOIN pg_namespace n ON n.oid = c.relnamespace
                WHERE n.nspname = 'public' AND c.relname = %s
                """,
                [table_name],
            )
            if not cursor.fetchone():
                continue
            _drop_recipe_id_fks(cursor, table_name)
            cursor.execute(
                """
                ALTER TABLE "%s"
                ADD CONSTRAINT "%s"
                FOREIGN KEY (recipe_id) REFERENCES recipes_recipe(id)
                ON DELETE CASCADE
                """
                % (table_name, new_conname)
            )


def _noop(apps, schema_editor) -> None:
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('recipes', '0011_rename_heart_to_like'),
    ]

    operations = [
        migrations.RunPython(_ensure_cascade_fks, _noop),
    ]
