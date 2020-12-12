import { FlyingCorpse } from './FlyingCorpse';
import { Blood } from './Blood';

const ENEMY_VELOCITY = 110;

export class Enemy {
  body: Phaser.Physics.Arcade.Body;

  position: Phaser.Math.Vector2;

  sprite: Phaser.GameObjects.Sprite;

  hp = 2;

  constructor(private scene: Phaser.Scene, position: Phaser.Math.Vector2) {
    this.sprite = this.scene.add
      .sprite(position.x, position.y, 'guy1')
      .setScale(5);
    scene.physics.world.enable(this.sprite);

    this.sprite.setData('ref', this);

    this.body = this.sprite.body as Phaser.Physics.Arcade.Body;
    this.body.setImmovable(true);

    this.position = position;

    this.body.velocity.x = ENEMY_VELOCITY;

    this.body.immovable = true;
    this.sprite.anims.play('guy1-walk');
  }

  public onHit = () => {
    this.hp--;

    if (this.hp > 0) {
      new Blood(this.scene, this.body.position, 100, 50, 50);
    } else {
      this.sprite.destroy();

      new FlyingCorpse(this.scene, this.body.position);
    }
  };

  public onCommeradeTouch = () => {
    this.body.velocity.x -= 20;
  };

  update() {}
}
