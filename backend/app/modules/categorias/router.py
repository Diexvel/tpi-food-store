from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from app.core.deps import require_role
from app.modules.categorias.schemas import CategoriaCreate, CategoriaRead, CategoriaUpdate
from app.modules.categorias.service import (
    CategoriaNoEncontrada,
    CategoriaService,
    NombreDuplicado,
)
from app.modules.usuarios.models import Usuario

router = APIRouter(prefix="/categorias", tags=["Categorías"])


def get_categoria_service() -> CategoriaService:
    return CategoriaService()


@router.get("", response_model=List[CategoriaRead])
def list_categorias(service: CategoriaService = Depends(get_categoria_service)):
    return service.list_activas()


@router.get("/{id}", response_model=CategoriaRead)
def get_categoria(id: int, service: CategoriaService = Depends(get_categoria_service)):
    try:
        return service.get_by_id(id)
    except CategoriaNoEncontrada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )


@router.post("", response_model=CategoriaRead, status_code=status.HTTP_201_CREATED)
def create_categoria(
    data: CategoriaCreate,
    current_admin: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        return service.create(data)
    except NombreDuplicado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoría con ese nombre",
        )


@router.put("/{id}", response_model=CategoriaRead)
def update_categoria(
    id: int,
    data: CategoriaUpdate,
    current_admin: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        return service.update(id, data)
    except CategoriaNoEncontrada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )
    except NombreDuplicado:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una categoría con ese nombre",
        )


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_categoria(
    id: int,
    current_admin: Usuario = Depends(require_role(["admin"])),
    service: CategoriaService = Depends(get_categoria_service),
):
    try:
        service.delete(id)
    except CategoriaNoEncontrada:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Categoría no encontrada",
        )
